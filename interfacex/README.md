# interfacex
expose interface      
`ifix('anon',(new (function(){ this.f=function(){ console.log("console"); return "1";}; this.x='';}))); `        
use interface        
`$(document).trigger("anon.f","data");`          
or       
`ifix("anon.f")("data");`        

blog post explaining it          
http://nikolamandic.me/?p=160
