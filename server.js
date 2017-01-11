
var express=require("express");
var http=require("http");
var socket_io=require("socket.io");
//定义全局数组变量
var users=[];

var app=express();
var server=http.createServer(app);
//引入socket.io模块并绑定到服务器
var io=socket_io.listen(server);  

//指定静态HTML文件的位置
app.use('/',express.static(__dirname+'/www'));  
server.listen(8080);
console.log("server running at 127.0.0.1:8080");

//socket部分
io.on("connection",function(socket){
    /*接收并处理客户端发送的foo事件
    socket.on("foo",function(data){
        console.log(data);
    });*/

   //接收并处理客户端发送的login事件
   //socket表示的是当前连接到服务器的那个客户端,所以代码socket.emit('foo')则只有自己收得到这个事件，
   //而socket.broadcast.emit('foo')则表示向除自己外的所有人发送该事件
   //io表示服务器整个socket连接，所以代码io.sockets.emit('foo')表示所有人都可以收到该事件。
    socket.on("login",function(nickname){
    	if(users.indexOf(nickname)>-1){
    		socket.emit("nickExisted");
    	}
    	else{
    		socket.userIndex=users.length;
    		socket.nickname=nickname;
    		users.push(nickname);
    		socket.emit("loginSuccess");
    		//向所有连接到服务器的客户端发送当前登陆用户的昵称 
    		io.sockets.emit("system",nickname,users.length,"login");
    	}

    });
    //同时再添加一个用户离开的事件，这个通过socket.io自带的disconnect事件完成，当一个用户断开连接，disconnect事件就会触发。
    socket.on("disconnect",function(){
    	users.splice(socket.userIndex,1);
    	socket.broadcast.emit("system",socket.nickname,users.length,"logout");
    });
    //处理发送消息事件，将此消息显示到其他用户中
    socket.on("postMsg",function(msg,color){
        socket.broadcast.emit("newMsg",socket.nickname,msg,color);
    });
    //处理发送图片，并将此消息显示到其他用户
    socket.on("postImg",function(imgData,color){
        socket.broadcast.emit("newImg",socket.nickname,imgData,color);
    });
});


