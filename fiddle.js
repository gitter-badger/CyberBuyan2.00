//imagine having dht routing and networks of webrtc peers at you fingertips to fiddle with
//here it is
/*
to test it out go to http://nikolamandic.github.io/Buyan/ open devtools and c/p in console code bellow
dependencies are peerJS and https://github.com/NikolaMandic/interfacex for exposing modules to everywhere over event loop(imagine using this chunk of code from ui available globally under this libarary)

*/

//this is network module it supports multiple networks of peers
function net(peers,id){
  function encode(header,m){
    return {header:header,message:m};
  }
  this.members=peers;
  var self=this;
  this.networks={"main":[]};
  var networkid="network"+id;
  //you can add a peer to a network with this function
  this.add=function(whatnet,peer){

    peer.getIP=function(){
     return peer.peerConnection.remoteDescription.sdp.split(" ")[12].split('\n')[0];
    }
    console.log(id+" added "+peer.peer+"@"+peer.getIP() + " to network "+ whatnet );
    var network = 1;
    if (self.networks[whatnet]){
        network=self.networks[whatnet];
    }else{
        network = self.networks[whatnet]=[]
    }
    network.push(peer);
    
    // Receive messages
    peer.on('data', function(data) {
      i(networkid+".onMessage")(peer,data)
    });
    console.log(self.members);    
    i("dht"+id+".onNewPeer")(peer);
  }
  //you can broadcast to a network with this here you pass network name and message
  this.broadcast=function(whatnet,message){
    for (index = 0; index < self.networks[whatnet].length; ++index) {
      self.networks[whatnet].send(message);
    }
  }
  //you can send to array of peers(array of peerJS connection objects) a message
  this.sendto=function(whatnet,message){
    
    if(whatnet["length"]>0){
      for (index = 0; index < whatnet.length; ++index) {
        console.log(whatnet[index].getIP()+" -> "+message);
        whatnet[index].send(message);
      }  
    }else if (whatnet["length"]==undefined){
      whatnet.send(message);
    }
  }
  //you can send message to a network upstream or downstream depending on dht routing function
  /*
  in short routing function says this peer is right or left from that peer(simple > comparison on peer id)
  */
  this.sends=function(whatnet,direction,message){
    console.log("network " + whatnet + " is being sent "+message+ " "+ direction);
    if(direction=="all"){
      self.broadcast(whatnet,message);
    }else if(direction=="upstream"){
    
      self.sendto(i("dht"+id+".findUpstreamPeers")(whatnet),encode({src:id,dst:direction,ttl:15},message));
    }else if(direction=="downstream"){

      self.sendto(i("dht"+id+".findDownstreamPeers")(whatnet),encode({src:id,dst:direction,ttl:15},message));
    }else{
      if(i("dht"+id+".compareAddresses")(id,direction)){
        self.sendto(i("dht"+id+".findUpstreamPeers")("main"),encode({src:id,dst:direction,ttl:15},message));
      }else{
        self.sendto(i("dht"+id+".findDownstreamPeers")("main"),encode({src:id,dst:direction,ttl:15},message));
      }
      //self.sendto(i("dht"+id+".nextHopToPeer")(direction),encode({src:id,dst:direction,ttl:15},message));
    }
  }
  //if message should be routed pass it down the network
  this.route=function(message){
    self.sendto(i("dht"+id+".nextHopToPeer")(message.header.dst),message);
    if(i("dht"+id+".compareAddresses")(message.header.dst,id)){
      self.sendto(i("dht"+id+".findUpstreamPeers")("main"),message);
    }else{
      self.sendto(i("dht"+id+".findDownstreamPeers")("main"),message);
    }
    //self.sendto(i("dht"+id+".findUpstreamPeers")(whatnet),message);
    //self.sends("main",message.message.header.dst,message);
  }
  //if it's for us do stuff
  this.process=function(peer,message){
     $(document).trigger("cyber_verbose",{source:peer,message:message});
     $(document).trigger("cyber",message);
  }
  //react when this network sends something and you see what is sent and who sent it
  this.onMessage=function(peer,message){
    if(message.header.ttl>1){
      message.header.ttl-=1;
      if(message.header.dst!=id){
        self.route(message);
      }else{
        self.process(peer,message);
      }
     console.log("id %s received message %s",id,JSON.stringify(message));
    }
  }
}

function messagePipeline(id){

}

/*
this module gets peer id and has function that distinguishes whether one peer is left or right from the other
*/
function dht(id){
   var self=this;
   self.id=id;
   self.dhtables={};
   this.getPeerAddress=function(peer){
     return peer.peer+"@"+peer.getIP();
   }
   //is peer left or right
   this.compareAddresses=function(p1,p2){
     return self.compareAddressesDiff(p1,p2)>0;
   }
   //hash space distance between adresses
   //it is string difference
   //if string is one big number substract the values
   this.compareAddressesDiff=function(p1,p2){
     return _.chain(p1)
             .map(function(v){ return v.charCodeAt(0);})
             .zip(_.chain(p2)
                   .map(function(v){ 
                   return v.charCodeAt(0);})
                   .value())
             .map(function(v,i,a){return ((v[1]?v[1]:0)-(v[0]?v[0]:0))*Math.pow(10,a.length-1-i);})
             .reduce(function(a,b){return a+b;})
             .value();
   }
   
   //find all peers that are right
   this.findUpstreamPeers=function(networkname,p){
    var downstream=[];
    var network=i("network"+id+".networks")().main;
    console.log("network of " + id + " is ",network );
    var peer = p || i("myidentities"+id+".identities")()[id];
    
    for (index = 0; index < network.length; ++index) {
      if(!self.compareAddresses(network[index].peer,peer.peer)){
        downstream.push(network[index]);
      }
    }
    //console.log("on " +self.id+ " upstream from "+ self.getPeerAddress(peer) + " are ");
    console.log(downstream);
    
    for (index = 0; index < downstream.length; ++index) {
     
        console.log(self.getPeerAddress(downstream[index]));
     
    }
    return downstream;
   }
   //minimize distance function to find the peer closest to the destination peer
   this.nextHopToPeer = function(p){
     var network=i("network"+id+".networks")().main;
     var peer = p || i("myidentities"+id+".identities")()[id];
     var distance=self.compareAddressesDiff(network[0].peer,peer);
     min=distance;
     var mini=0;
     for (index = 1; index < network.length; ++index) {
       distance=self.compareAddressesDiff(network[index].peer,peer);
       if(min>distance){
         min=distance;
         mini=index;
       }
     }
     return network[mini];

   }
   //find all peers that are left
   this.findDownstreamPeers=function(networkname,p){
    var downstream=[];
    var network=i("network"+id+".networks")().main;
    console.log("network of " + id + " is ",network );
    var peer = p || i("myidentities"+id+".identities")()[id];
   
    for (index = 0; index < network.length; ++index) {
      if(self.compareAddresses(network[index].peer,peer.peer)){
        downstream.push(network[index]);
      }
    }
    console.log("on " +self.id+ " downstream from "+ self.getPeerAddress(peer) + " are ");
    console.log(downstream);
    
    for (index = 0; index < downstream.length; ++index) {
     
        console.log(self.getPeerAddress(downstream[index]));
     
    }
    return downstream;
   }
   //when we get new peer from somewhere we could do some custom stuff
   this.onNewPeer=function(peer){
     self.findDownstreamPeers("main",peer);
   }
}
//this module holds different identities for example you might want one username on one network and different on other
function identityBase(defaul,peer){
  var self=this;
  self.identities={};
  self.identities["default"]=peer;
  
  self.identities[defaul]=peer;
  this.add=function(name,p){
    self.identities[name]=p;
  }

}
//low level stuff for connecting to other peers via peerJS
function pirJS(id){
   var networkid="network"+id;
   this.peer;
   var self=this;
   this.init=function(){
    var connParams = {
     "host": "localhost",
     "port": 8000, 
     "key": "prokletdajepapa"
     };
     var peer = new Peer(id,connParams);
     window.peer=peer;
     self.peer=peer;
     peer.getIP=function(){
       return "ip";
     }
     console.log(peer);
     peer.on('open', function(id) {
       console.log('My peer ID is: ' + id);
      //i("network.add")("main",peer);
     });
     peer.on('connection', function(conn) {
       //when someone connects add it to netwrok
       console.log(id + " connection opened from " + conn.peer);
       i(networkid+".add")("main",conn);
     });
     //expose network over interfacex
     i(networkid,new net([],id)); 
     //expose dht over interfacex
     i("dht"+id,new dht(id));
     i("myidentities"+id,new identityBase(id,peer));
     
  }
   this.connect=function(destPeerId){
     var conn = self.peer.connect(destPeerId); 
     conn.on('open', function() {
       //when connected to some1 add it to network
       console.log(id+ " connection opened to " + destPeerId);
       i(networkid+".add")("main",conn);
     });   
   }   
   this.sends=function(network,direction,message){
     i("network"+id+".sends")(network,direction,message);
   }
}
//tests 
function testb(){
    var d=Date.now();
    var p01 =new pirJS("01_"+d);
    var p02 =new pirJS("02_"+d);
    var p03 =new pirJS("03_"+d);
    var p04 =new pirJS("04_"+d);
    var p05 =new pirJS("05_"+d);
    var p06 =new pirJS("06_"+d);
    var p07 =new pirJS("07_"+d);
    var p08 =new pirJS("08_"+d);
    var p09 =new pirJS("09_"+d);
    var p10 =new pirJS("10_"+d);
    var p11 =new pirJS("11_"+d);
    p01.init();
    p02.init();
    p03.init();
    p04.init();
    p05.init();
    p06.init();
    p07.init();
    p08.init();
    p09.init();
    p10.init();
    p11.init();
  this.test1=function(){
    console.log("dht test sending to peer that is upstream");
    
    p01.connect("01_"+d);
    p01.connect("02_"+d);
    p01.connect("03_"+d);
    p01.connect("04_"+d);
    p01.connect("05_"+d);

    p04.connect("07_"+d);
    setTimeout(function(){
      console.log("sending");
     p01.sends("main","07_"+d,"karaj cigane!!!");
    },10000);
    
    console.log("//////dht test sending to peer that is upstream end/////////");
  }

  this.test2=function(){
    console.log("dht test sending to peer that is downstream");
    
    T.connect("Misa"+d);
    T.connect("Metalika"+d);
    setTimeout(function(){
      console.log("sending");
     T.sends("main","upstream","karaj cigane!!!");
    },30000);
    
    console.log("//////dht test sending to peer that is downstream end/////////");
  }

}

(new testb()).test1();


  // Send messages
  //conn.send('Hello!');
