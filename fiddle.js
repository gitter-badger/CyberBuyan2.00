//imagine having dht routing and networks of webrtc peers at you fingertips to fiddle with
//here it is
/*
to test it out go to http://nikolamandic.github.io/Buyan/ open devtools and c/p in console code bellow
dependencies are peerJS and https://github.com/NikolaMandic/interfacex for exposing modules to everywhere over event loop(imagine using this chunk of code from ui available globally under this libarary)

*/

//this is network module it supports multiple networks of peers
function net(peers,id){
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
    
    for (index = 0; index < whatnet.length; ++index) {
      console.log(whatnet[index].getIP()+" -> "+message);
      whatnet[index].send(message);
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
    }
    if(direction=="upstream"){
    
      self.sendto(i("dht"+id+".findUpstreamPeers")(whatnet),message);
    }
    if(direction=="downstream"){

      self.sendto(i("dht"+id+".findDownstreamPeers")(whatnet),message);
    }
  }
  //react when this network sends something and you see what is sent and who sent it
  this.onMessage=function(message,peer){
    
  }
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
     return self.getPeerAddress(p1)>self.getPeerAddress(p2);
   }
   //find all peers that are right
   this.findUpstreamPeers=function(networkname,p){
    var downstream=[];
    var network=i("network"+id+".networks")().main;
    console.log("network of " + id + " is ",network );
    var peer = p || i("myidentities"+id+".identities")()[id];
    
    for (index = 0; index < network.length; ++index) {
      if(!self.compareAddresses(network[index],peer)){
        downstream.push(network[index]);
      }
    }
    console.log("on " +self.id+ " upstream from "+ self.getPeerAddress(peer) + " are ");
    console.log(downstream);
    
    for (index = 0; index < downstream.length; ++index) {
     
        console.log(self.getPeerAddress(downstream[index]));
     
    }
    return downstream;
   }
   //find all peers that are left
   this.findDownstreamPeers=function(networkname,p){
    var downstream=[];
    var network=i("network"+id+".networks")().main;
    console.log("network of " + id + " is ",network );
    var peer = p || i("myidentities"+id+".identities")()[id];
   
    for (index = 0; index < network.length; ++index) {
      if(self.compareAddresses(network[index],peer)){
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
     "host": "buyan-nikolamandic.rhcloud.com",
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
    var T =new pirJS("Taras"+d);
    var M =new pirJS("Misa"+d);
    var D =new pirJS("Dule"+d);
    var C1 =new pirJS("Cigan1"+d);
    var C2 =new pirJS("Cigan2"+d);
    var ME =new pirJS("Metalika"+d);
    var G1 =new pirJS("Grobar1"+d);
    var G2 =new pirJS("Grobar2"+d);
    var G3 =new pirJS("Grobar3"+d);
    var G4 =new pirJS("Grobar4"+d);
    var G5 =new pirJS("Grobar5"+d);
    T.init();
    M.init();
    D.init();
    C1.init();
    C2.init();
    ME.init();
    G1.init();
    G2.init();
    G3.init();
    G4.init();
    G5.init();
  this.test1=function(){


    T.connect("Misa"+d);
    setTimeout(function(){
    T.sends("main","upstream","karaj cigane!!!");
     },30000);
  }

}

//(new testb()).test1();

  // Send messages
  //conn.send('Hello!');
