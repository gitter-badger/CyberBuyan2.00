//imagine having dht routing and networks of webrtc peers at you fingertips to fiddle with
//here it is
/*
to test it out go to http://nikolamandic.github.io/Buyan/ open devtools and c/p in console code bellow
dependencies are peerJS and https://github.com/NikolaMandic/interfacex for exposing modules to everywhere over event loop(imagine using this chunk of code from ui available globally under this libarary)

*/


//this is small wrapper around webrtc
/*

  usage:
   Tsar Saltan:
   //instantiate wrapper
   konnection=new K();
   //make offer for the other end of connection
   konnection.makeOffer().then(function(offer){sendOfferToTsaritsa});
   Tsaritsa:
   konnection=new K();
   konnection.handlePeer(offer).then(function(answer){
     sendAnswerToTsarSaltan;
   });
   Tsar Saltan:
   konnection.handlePeer(answer)

   //now connection is open no central server
  

*/
function K(){
  var self=this;
  var cfg = {"iceServers":[{"url":"stun:23.21.150.121"}]},
      con = { 'optional': [{'DtlsSrtpKeyAgreement': true}] };
      /*
  var icePromise = new Promise(function(resolve,reject){
    
    $(document).on("iceCandidate",function(x){
      if(x){
        resolve(JSON.stringify(self.pc1.localDescription));
      }else
      {
        reject(new Error("no kandidat"));
      }
    });

  });
  */
  self.dataChannelSetup=function(dc1){
    self.dc1=dc1;
    self.dc1.onopen = function (e) {
        console.log('data channel connect');
    }
    self.dc1.onmessage = function (e) {
      if (e.data.size) {
        self.onMessage(e.data);
      }
      else {
          if (e.data.charCodeAt(0) == 2) {
             // The first message we get from Firefox (but not Chrome)
             // is literal ASCII 2 and I don't understand why -- if we
             // leave it in, JSON.parse() will barf.
             return;
          }
          console.log(e);
          var data = JSON.parse(e.data);
          self.onMessage(e.data);
      }
    };
  }
  self.makeDataChannel=function(){
    self.dc1 = self.pc1.createDataChannel('test', {reliable:true});
    self.dataChannelSetup(self.dc1);
  }
  self.newConnection=function newConnection(){
    self.pc1 = new RTCPeerConnection(cfg, con);
    self.pc1.onicecandidate = self.onCandidate;
    self.pc1.onconnection = self.onOpen;
    function onsignalingstatechange(state) {
      console.info('signaling state change:', state);
    }

    function oniceconnectionstatechange(state) {
        console.info('ice connection state change:', state);
    }

    function onicegatheringstatechange(state) {
        console.info('ice gathering state change:', state);
    }

    self.pc1.onsignalingstatechange = onsignalingstatechange;
    self.pc1.oniceconnectionstatechange = oniceconnectionstatechange;
    self.pc1.onicegatheringstatechange = onicegatheringstatechange;
    self.pc1.ondatachannel = function (e) {
      //var fileReceiver2 = new FileReceiver();
      self.dc1= e.channel || e; // Chrome sends event, FF sends raw channel
      self.dataChannelSetup(self.dc1);
    }
  }
  self.makeOffer=function(){
    if(self.pc1==undefined){
      self.newConnection();
    }
    if(self.dc1==undefined){
      self.makeDataChannel();
    }
    self.pc1.createOffer(function (desc) {
    self.pc1.setLocalDescription(desc, function () {});
      console.log("created local offer", desc);
    }, function () {console.warn("Couldn't create offer");});
    return  new Promise(function(resolve,reject){
    
    $(document).on("iceCandidate",function(x){
      if(x){
        resolve(JSON.stringify(self.pc1.localDescription));
      }else
      {
        reject(new Error("no kandidat"));
      }
    });

    });
  }
  self.onCandidate=function (e) {
      console.log("ICE candidate (pc1)", e);
      $(document).trigger("iceCandidate",e.candidate)
      if (e.candidate == null) {
          //$?$(document).trigger("icedesc",JSON.stringify(self.pc1.localDescription)):1;
          console.log("local offer ",JSON.stringify(self.pc1.localDescription));

        //  icePromise.resolve(self.pc1.localDescription);
      }else{
      //    icePromise.reject(new Error("no kandidat"));
      }
  }
  self.handlePeer = function(answer){
    
    if(self.pc1==undefined){
      self.newConnection();
    }
    var parsed=(typeof(answer) === "string")?JSON.parse(answer):answer;
    console.log("parsed",parsed);
    if(parsed.type==="offer"){
      self.answerFromOffer(parsed);
      var pr= new Promise(function(resolve,reject){
        
        $(document).on("iceCandidate",function(x){
          if(x){
            resolve(JSON.stringify(self.pc1.localDescription));
          }else
          {
            reject(new Error("no kandidat"));
          }
        });

      });
    }else if(parsed.type==="answer"){
      self.onAnswerFromPeer(parsed);
    }else{
      console.log("peer sent invalid request");
    }
    return pr;
  }
  self.onAnswerFromPeer=function(answer){
    var answerDesc=
     (typeof(answer) === "string")?
      new RTCSessionDescription(JSON.parse(answer)):new RTCSessionDescription(answer);
    console.log("Received remote answer: ", answerDesc);
    self.pc1.setRemoteDescription(answerDesc);
  }

  self.answerFromOffer=function(offer){
    var sdesc=
     (typeof(offer) === "string")?
      new RTCSessionDescription(JSON.parse(offer)):new RTCSessionDescription(offer);

    self.pc1.setRemoteDescription(sdesc);
    self.pc1.createAnswer(function (answerDesc) {
        console.log("Created local answer: ", answerDesc);
        self.pc1.setLocalDescription(answerDesc);
    }, function () { console.warn("No create answer"); });

  }
  self.sendAnswer=function(){
    var answerDesc = new RTCSessionDescription(JSON.parse(answer));
    handleAnswerFromPC2(answerDesc);
  }
  self.onOpen=function(){
    console.log("Datachannel connected");
  }
  self.onMessage=function(message){

  }
}


function peerExchange(id){

  var self=this;
  //someboy requested my webrtc offer I am gonna send it to them
  this.requestPeer=function(message){
    console.log("%s requested peers");
    i("network"+id+".sendto")(i("network"+id+".networks")().main,
                              {subsystem:"peerExchangeSubsystemMessage",type:"requestPeer"});
  }
  //I am gonna send my webrtc offer
  this.sendPeer=function(message){
    console.log("%s sent out his peers   %s",id,[1,2]);
    (new K()).makeOffer().then(function(offer){
    i("network"+id+".sendto")(i("network"+id+".networks")().main,
                              {subsystem:"peerExchangeSubsystemMessage",type:"peerList",data:offer});
    });
    
  }  
  //recieved offer from somebody and now I am gonna handle it
  this.receivePeer=function(message){
    console.log("%s received peers %s",id,message);
    i("network"+id+".networks")().offers.push(message.message.data);
    
  }
  //make request so that somebody sends us bunch of offers 
  this.requestPeers=function(message){
    console.log("%s requested peers");
    i("network"+id+".sendto")(i("network"+id+".networks")().main,
                              {subsystem:"peerExchangeSubsystemMessage",type:"requestPeers"});
  }
  //send bunch of offers we have to somebody
  this.sendPeers=function(message){

    console.log("%s sent out his peers   %s",id,[1,2]);
    i("network"+id+".sendto")(i("network"+id+".networks")().main,
                              {subsystem:"peerExchangeSubsystemMessage",type:"peerList",data:[1,2]});
    
  }  
  //handle bunch of offers we got
  this.receivePeers=function(message){
    console.log("%s received peers %s",id,message);
    i("network"+id+".networks")().offers.push(message.message.data);
    
  }
  //all messages  recieved go trough here sort them out 
  this.handleCyber=function(message){
    console.log("%s peerexchange sybsystem recieved %s",id ,JSON.stringify(message));
    
    if(message.message.subsystem==="peerExchangeSubsystemMessage"){
      switch (message.message.type) {
        case "requestPeers":
            self.sendPeers(message);
          break;
        case "peersList":
            self.receivePeers(message);
          break;
        default:
          break;
      }
    }
  }
  $(document).on("cyber_under_the_hood",function(ev,message){
    i("peerExchange"+id+".handleCyber")(message);
  });
  setTimeout(function(){
    self.requestPeers();
  },10000);
}



//this is network module it supports multiple networks of peers
function net(peers,id){
  //this function connects header and message
  function encode(header,m){
    return {header:header,message:m};
  }
  //peers that we are conneced to
  this.members=peers;
  //object instance
  var self=this;
  //there can be multiple logical networks
  //network main is the default that contains them all
  this.networks={"main":[]};
  //this is the instance id of this javascript object 
  //we want that because then we can test easily
  //we can make a test that has 2 networks with different ids and simulate communication
  var networkid="network"+id;

  //you can add a peer to a network with this function
  this.add=function(whatnet,peer){
    //this gets ip from webrtc internal object
    peer.getIP=function(){
     return peer.peerConnection.remoteDescription.sdp.split(" ")[12].split('\n')[0];
    }
    console.log(id+" added "+peer.peer+"@"+peer.getIP() + " to network "+ whatnet );
    var network = 1;
    //if network exists get that 
    if (self.networks[whatnet]){
        network=self.networks[whatnet];
    }else{
     //if not create network
        network = self.networks[whatnet]=[]
    }
    //put peer into network
    network.push(peer);
    
    // Receive messages
    peer.on('data', function(data) {
      //if we received message call onMessage function for this javascript network object 
      i(networkid+".onMessage")(peer,data)
    });
    console.log(self.members);    
    // add this new peer to distributed hash table
    i("dht"+id+".onNewPeer")(peer);
  }
  //you can broadcast to a network with this here you pass network name and message
  this.broadcast=function(whatnet,message){
    //for each peer in network send message
    for (index = 0; index < self.networks[whatnet].length; ++index) {
      self.networks[whatnet].send(message);
    }
  }
  //you can send to array of peers(array of peerJS connection objects) a message
  this.sendto=function(whatnet,message){
    //if we are sending to array of peers
    if(whatnet["length"]>0){
      //send it to everybody
      for (index = 0; index < whatnet.length; ++index) {
        console.log(whatnet[index].getIP()+" -> "+message);
        //if message we are sending has header(which means we are routing someone else's message')
        if (message.header && message.header.ttl){
          //just send it
          whatnet[index].send(message);
        }else{
          //otherwise this message is comming from us then make header
          whatnet[index].send(encode({src:id,dst:whatnet[index].peer,ttl:15},message));
        }
        
      }
    }else if (whatnet["length"]==undefined){
      if (message.header.ttl){
          whatnet.send(message);
        }else{
          whatnet.send(encode({src:id,dst:whatnet.peer,ttl:15},message));
        }
    }
  }
  //you can send message to a network upstream or downstream depending on dht routing function
  /*
  this is higher level function that gives you more options to send messages
  in short routing function says this peer is right or left from that peer(simple > comparison on peer id)
  */
  this.sends=function(whatnet,direction,message){
    console.log("network " + whatnet + " is being sent "+message+ " "+ direction);
    //we can specify that we want to send to all peers in this network
    if(direction=="all"){
      self.broadcast(whatnet,message);
    }else if(direction=="upstream"){
      //we can send to upstream peers in this network
      //first function in dht object is called that gets us all the peers that are upstream from 
      //the place where we are in this network and then we send the message to all of the peers
      self.sendto(i("dht"+id+".findUpstreamPeers")(whatnet),message);
    }else if(direction=="downstream"){
      //we can send to downstream peers in this network
      self.sendto(i("dht"+id+".findDownstreamPeers")(whatnet),message);
    }else{
      //if we are not sending to all and we are not sending upstream or downstream
      //we can send to specific address in dht
      //for example there can be a computer somewhere with id 123456
      //that is not connected directly to us
      //but we might know somebody that knows somebody
      //so what we do we first check if that guy commes upstream or downstream
      //if it is downstream just send this message to all of the downstream guys
      if(i("dht"+id+".compareAddresses")(id,direction)){
        self.sendto(i("dht"+id+".findUpstreamPeers")("main"),message);
      }else{
        self.sendto(i("dht"+id+".findDownstreamPeers")("main"),message);
      }
      //self.sendto(i("dht"+id+".nextHopToPeer")(direction),encode({src:id,dst:direction,ttl:15},message));
    }
  }
  //if message should be routed pass it down the network
  this.route=function(message){
    //so we need to find out what is the guy in our dht that comes closest to the one we want to send to
    //and we send to it
    self.sendto(i("dht"+id+".nextHopToPeer")(message.header.dst),message);
    //we also check if the guy we want to send to is upstream
    //we just send to all upstream people
    if(i("dht"+id+".compareAddresses")(message.header.dst,id)){
      self.sendto(i("dht"+id+".findUpstreamPeers")("main"),message);
    }else{
      self.sendto(i("dht"+id+".findDownstreamPeers")("main"),message);
    }
    //self.sendto(i("dht"+id+".findUpstreamPeers")(whatnet),message);
    //self.sends("main",message.message.header.dst,message);
  }
  //if it's for us do stuff
  //message that just arrived is addressed for us so we do something with it
  this.process=function(peer,message){
     
     //we emit event that has most info 
     //from which peer did the message came
     //and the message
     $(document).trigger("cyber_verbose",{source:peer,message:message});
     //if message is meant to be for some utility like the code responsible for peer exchange
     //then we emit special message(this is for convenience so that we do not check manually)
     if(message.header && message.message.subsystem){
       $(document).trigger("cyber_under_the_hood",message);
     }else{
       // if it is not utility message we just emit it for what ever code that needs it
       $(document).trigger("cyber",message);
     }
     
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
     return _.chain(p1) //grab first address
             .map(function(v){ return v.charCodeAt(0);}) //convert characters to charcodes
             .zip(_.chain(p2)//grab second address
                   .map(function(v){ return v.charCodeAt(0);}) //convert characters to charcodes
                   .value())// join charcodes from two adresses in pairs(first with first)
              //calcualte difference between each pair if there is no character then take 0
              //consider that each pair has it's weight in decimal system
             .map(function(v,i,a){return ((v[1]?v[1]:0)-(v[0]?v[0]:0))*Math.pow(10,a.length-1-i);})
             //now in previous step we treated numbers as one big decimal digit
             //now we add those digits up
             .reduce(function(a,b){return a+b;})
             //and we get difference
             .value();
             /*
             this is how it works
                asd - bca = [1,2,3] - [3,2,1] = [[1-3],[2-2],[3-1]]=[-2*100,0*10,2*1]

             */
   }
   
   //find all peers that are right
   this.findUpstreamPeers=function(networkname,p){
    var downstream=[];
    //get all peers from the network we want to query
    var network=i("network"+id+".networks")().main;
    console.log("network of " + id + " is ",network );
    //get my id
    var peer = p || i("myidentities"+id+".identities")()[id];
    //for each peer check if it is upstream and if it is push it to array
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
    //return that array
    return downstream;
   }
   //minimize distance function to find the peer closest to the destination peer
   //closest is the one that has minimal distance in dht
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
     i("peerExchange"+id,new peerExchange(id)); 
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
    describe("A suite", function() {
      it("contains spec with an expectation", function() {
        expect(true).toBe(true);
      });
    });
/*
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
     //p01.sends("main","07_"+d,"karaj cigane!!!");
    },10000);
    
    console.log("//////dht test sending to peer that is upstream end/////////");
  }

  this.test2=function(){
    console.log("dht test sending to peer that is downstream");
    
    T.connect("Misa"+d);
    T.connect("Metalika"+d);
    setTimeout(function(){
      console.log("sending");
     //T.sends("main","upstream","karaj cigane!!!");
    },30000);
    
    console.log("//////dht test sending to peer that is downstream end/////////");
  }
*/
}
/*
(new testb()).test1();
*/

  // Send messages
  //conn.send('Hello!');
