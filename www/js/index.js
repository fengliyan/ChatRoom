window.onload=function(){
	 //实例并初始化我们的hichat程序
	var chatroom=new ChatRoom();
	chatroom.init();

}
//定义我们的hichat类
var ChatRoom=function(){
	this.socket=null;
}
//向原型添加业务方法
ChatRoom.prototype={
	init:function(){
		var that=this;
		//建立到服务器的socket连接
		this.socket=io.connect();
		//监听socket的connect事件，此事件表示连接已经建立
		this.socket.on("connect",function(){
			document.getElementById('info').textContent = 'get yourself a nickname :)';
            document.getElementById('nickWrapper').style.display = 'block';
            document.getElementById('nicknameInput').focus();
		});

		//输入昵称，向服务器注册
		document.getElementById("btn_ok").addEventListener("click",function(){
			var nickname=document.getElementById("nicknameInput").value;
			 //检查昵称输入框是否为空,trim()去掉字符串两边空格
			if(nickname.trim().length!=0){
				//不为空，则发起一个login事件并将输入的昵称发送到服务器
				that.socket.emit("login",nickname);
			}
			else{
				document.getElementById("nicknameInput").focus();
			}
		},false);
		//发送消息，出发postMsg事件
		document.getElementById("send").addEventListener("click",function(){
			var messageInput=document.getElementById("message");
			var msg=messageInput.value;
			//获得颜色，并把颜色传递出去
			var color=document.getElementById("colorstyle").value;
			messageInput.value="";
			messageInput.focus();
			if(msg.trim().length!=0){
				//把消息发送到服务器
				that.socket.emit("postMsg",msg,color);
				//把自己的消息显示到自己的窗口中
				that.displayMsg("me",msg,color);
			}
		},false);




		//按enter键可以实现登陆 发送消息
		//输入昵称，向服务器注册
		document.getElementById("nicknameInput").addEventListener("keyup",function(e){
			if(e.keyCode==13){
			var nickname=document.getElementById("nicknameInput").value;
			 //检查昵称输入框是否为空,trim()去掉字符串两边空格
			if(nickname.trim().length!=0){
				//不为空，则发起一个login事件并将输入的昵称发送到服务器
				that.socket.emit("login",nickname);
			}
			else{
				document.getElementById("nicknameInput").focus();
			}
		}
		},false);
		//发送消息，出发postMsg事件
		document.getElementById("message").addEventListener("keyup",function(e){
			if(e.keyCode==13){
			var messageInput=document.getElementById("message");
			var msg=messageInput.value;
			//获得颜色，并把颜色传递出去
			var color=document.getElementById("colorstyle").value;
			messageInput.value="";
			messageInput.focus();
			if(msg.trim().length!=0){
				//把消息发送到服务器
				that.socket.emit("postMsg",msg,color);
				//把自己的消息显示到自己的窗口中
				that.displayMsg("me",msg,color);
			}
		}
		},false);




        //发送图片,监听file的change事件，看是否有文件被选中
        document.getElementById("sendImage").addEventListener("change",function(){
        	//获得颜色，并把颜色传递出去
			var color=document.getElementById("colorstyle").value;

        	if(this.files.length!=0){
        		var file=this.files[0],
        		    reader=new FileReader();
        		if(!reader){
        			that.displayMsg("system","your browser doesn't support FileReader","red");
        			this.value="";
        			return;
        		}
        		reader.onload=function(e){
        			this.value="";
        			//发送图片，此时后面参数为图片的url
        			that.socket.emit("postImg",e.target.result,color);
        			that.displayImage("me",e.target.result,color);
        		}
        		reader.readAsDataURL(file);

        	}
        },false);



        //初始化表情，点击emoji按钮显示表情
        this.initEmoji();
        document.getElementById("emoji").addEventListener("click",function(e){
        	var emojiWrapper=document.getElementById("emojiWrapper");
        	emojiWrapper.style.display="block";
        	//阻止事件冒泡
        	e.stopPropagation();

        },false);
        //点击页面其他地方关闭表情窗口
        document.body.addEventListener("click",function(e){
        	var emojiWrapper=document.getElementById("emojiWrapper");
        	if(e.target!=emojiWrapper&&e.target.nodeName.toLowerCase()!="img"){
        		emojiWrapper.style.display="none";
        	}
        },false);
        //某个表情被选中后，转换为相应的表情代码插入到消息框中
        document.getElementById("emojiWrapper").addEventListener("click",function(e){
        	var target=e.target;
        	if(target.nodeName.toLowerCase()=="img"){
        		var message=document.getElementById("message");
        		message.focus();
        		message.value=message.value+"[emoji:"+target.title+"]";
        	}
        },false);


        //清除记录
        document.getElementById("cleanBtn").addEventListener("click",function(){
        	var history=document.getElementById("history");
        	history.innerHTML="";
        },false);




    //处理服务器端传过来的nickExisted事件
    this.socket.on("nickExisted",function(){
    	document.getElementById("info").textContent="nickname has existed!";
    });
   //处理服务器端传过来的loginSuccess事件
    this.socket.on("loginSuccess",function(){
    	document.title="hichat"+document.getElementById("nicknameInput").value;
    	document.getElementById("loginWrapper").style.display="none";
    	document.getElementById("message").focus();
    });
    //处理用户登录或离开事件
    this.socket.on("system",function(nickname,userCount,type){
    	var msg=nickname+(type=="login"?" joined":" left");
    	/*var p=document.createElement("p");
    	p.textContent=msg;
    	document.getElementById("history").appendChild(p);*/
    	//通过displayMsg()显示系统消息
    	that.displayMsg("system",msg,"red");

    	document.getElementById("status").textContent=userCount+(userCount>1?" users":" user")+" online";
    });
    //客户端接收服务器发送的newMsg事件，并将聊天消息显示到页面
    this.socket.on("newMsg",function(user,msg,color){
    	that.displayMsg(user,msg,color);
    });
    //客户端接收服务器发送的newImg事件，并将图片显示到页面
    this.socket.on("newImg",function(user,imgData,color){
    	that.displayImage(user,imgData,color);
    });
	},

	
	//显示消息方法
	displayMsg:function(user,msg,color){
		var container=document.getElementById("history"),
		    msgToDisplay=document.createElement("p"),
		    date=new Date().toTimeString().substr(0,8);
        //将消息中的表情转换为图片
		 msg=this.showEmoji(msg);
		 //判断该方法在调用时有没有传递颜色参数，没有传递颜色的话默认使用#000即黑色。
	     msgToDisplay.style.color=color||"#000";
	     //向消息添加日期
	     msgToDisplay.innerHTML=user+"<span class='timespan'>("+date+")</span>"+msg;
	     container.appendChild(msgToDisplay);
	     //
	     container.scrollTop=container.scrollHeight;

	},
    //显示图片方法
	displayImage:function(user,imgData,color){
		var container=document.getElementById("history"),
		    msgToDisplay=document.createElement("p"),
		    date=new Date().toTimeString().substr(0,8);

		msgToDisplay.style.color=color||"#000";
		//考虑到缩小后的图片有可能失真，用户看不清，我们需要提供一个方法让用户可以查看原尺寸大小的图片，所以将图片用一个链接进行包裹，当点击图片的时候我们打开一个新的窗口页面，
		//并将图片按原始大小呈现到这个新页面中让用户查看。
        msgToDisplay.innerHTML=user+"<span class='timespan'>("+date+")<br>"+
        "<a href='"+imgData+"' target='_blank'><img src='"+imgData+"'></a>";

		container.appendChild(msgToDisplay);
		container.scrollTop=container.scrollHeight;

	},
    //初始化表情,将表情添加到emojiWrapper中
	initEmoji:function(){
       var emojiWrapper=document.getElementById("emojiWrapper"),
           //创建一个新的空的文档片段 
           docFragment=document.createDocumentFragment();
       for(var i=69;i>0;i--){
       	  var emojiitem=document.createElement("img");
       	  emojiitem.src="../content/emoji/"+i+".gif";
       	  emojiitem.title=i;
       	  docFragment.appendChild(emojiitem);
       }
       emojiWrapper.appendChild(docFragment);
	},
    //正则搜索其中的表情符号，将其替换为img标签
	showEmoji:function(msg){
		var match,result=msg,
		    reg=/\[emoji:\d+\]/g,
		    emojiIndex,
		    totalEmojiNum=document.getElementById("emojiWrapper").children.length;
		while(match=reg.exec(msg)){
			emojiIndex=match[0].slice(7,-1);
			if(emojiIndex>totalEmojiNum){
				result=result.replace(match[0],"[X]");
			}
			else{
				result=result.replace(match[0],"<img src='../content/emoji/"+emojiIndex+".gif'>");

			}
		}
		return result;
	}
}