
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