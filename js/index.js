/**
 * Error:
 * خطأ عن الرفع خطئ واجهيي فقط لا غير
 * في حالة الرفع لبعص العناصر في القائمة
 * والتي تتمثل في ان العنصر يحمل 
 * #num_# 
 * # غير الذي في الـ 
 */

const imgur = require('imgur');
var images_url = []
  , image_id   = []
  , all_images = []
  , full_data,
    temp_data;
const fs = require("fs");
const {clipboard, remote} = require('electron');
const {Menu, MenuItem, dialog} = remote;


imgur.setClientId('93a1112090423a2');
imgur.setAPIUrl('https://api.imgur.com/3/');

String.prototype.replaceall = function(search, replacement) {
  var target = this;
  return target.split(search).join(replacement);
};

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

function uploadall(_this){
  //getallformxml();
  $(_this).attr('disabled','disabled');
  $("#refreshbtn").attr('disabled','disabled');
  $("#images_dir").attr('disabled','disabled');

  setTimeout(function(){
    if(images_url.length == 0){
      $(_this).removeAttr('disabled');
      $("#refreshbtn").removeAttr('disabled');
      $("#images_dir").removeAttr('disabled');
    }
    var i = 0,j = 0;
    $.each( images_url , function( key, value ) {
      setTimeout(function (){
          imgur.uploadFile(value)
              .then(function (json) {
                  i = i + 1;
                  //alert(json.data.link);
                  $("#num_"+i+" progress").attr('value','2');
                  $("#image").attr("src",value);
                  $.each(all_images,function (k,v) {
                    if(v["url"] == value){
                      full_data = full_data.replaceall(v["regex"],(v["regex"].replaceall(v["url"],json.data.link)));
                    }
                  });
                  if(images_url.length === i){
                    $(_this).removeAttr('disabled');
                    fs.writeFile('out_template.xml', full_data, 'utf8', function (err) {
                      if(err){
                          dialog.showErrorBox("Error",err);
                      }else{
                          dialog.showMessageBox({ message:"Out File: out_template.xml",type:"info",buttons:['ok'] });
                      }
                      $(_this).removeAttr('disabled');
                      $("#refreshbtn").removeAttr('disabled');
                      $("#images_dir").removeAttr('disabled');
                    });
                      
                  }
              })
              .catch(function (err) {
                  dialog.showErrorBox("Error",err.message);
                  $("#remaining").html(parseInt(0));
                  $(_this).removeAttr('disabled');
                  $("#refreshbtn").removeAttr('disabled');
                  $("#images_dir").removeAttr('disabled');
              });
      },15000*(j+1));    
      j++;
    });
    $("#remaining").html(''+(15*(j)));
    setInterval(function(){
      if (parseInt($("#remaining").html()) > 0){
              $("#remaining").html(parseInt($("#remaining").html())-1);
      }
    },1000);
  },1000);
}






var num_err = 0
   ,num_scu = 0
   ,__datatemp = [];
function searchinfile(file) {
  var qualityRegex = /url\u0028(.*)\u0029/igm,
    matches,
    qualities = [];

    while (matches = qualityRegex.exec(file)) {
        console.dir(matches);
        qualities.push({"regex":decodeURIComponent(matches[0]),"url":decodeURIComponent(matches[1])});
    }
    var _qualityRegex = /(src|background)( ?= ?)("|')?([^"^'^#^ ^>]+?|\/\?)(\.png|\.gif|\.jpg|\?|\?)([^"^'^>^#^ ]+)?(\3|#| |>)/igm;

    while (matches = _qualityRegex.exec(file)) {
        console.dir(matches);
        qualities.push({"regex":decodeURIComponent(matches[0]),"url":decodeURIComponent(matches[4]+matches[5])});
    }
    return qualities;
}

function getallformxml() {
  $("#viewer").html("");
  full_data = "";
  num_scu = 0;
  num_err = 0;
  images_url = [];
  __datatemp = [];
  fs.readFile('template.xml', 'utf8', function (err,data) {
    if (err) {
      return alert(err);
    }
    full_data = data;
    temp_data = full_data.replaceall("{$image_path}",$("#images_dir").val());
    temp_data = temp_data.replaceall("{$theme['imgdir']}",$("#images_dir").val());
    all_images = searchinfile(temp_data);
    $.each(all_images,function(key,value){
        fs.exists(value["url"], function(exists) {
          if( $.inArray(value["url"], __datatemp) < 0 ){
          if (exists) {
            num_scu = num_scu + 1;
            $("#viewer").html($("#viewer").html()+"<div title='Image was found' oncontextmenu='func_contextmenu(this);' class='find_file find_yes' id='num_"+num_scu+"'><i class='ion-checkmark-circled'></i> <progress value='0' max='2'></progress> " + value["url"] + " <script type='json'>"+JSON.stringify(value)+"</script></div>");
            images_url.push(value["url"]);
          }else {
            num_err = num_err + 1;
            $("#viewer").html($("#viewer").html()+"<div title='No image found' oncontextmenu='func_contextmenu(this);' class='find_file find_no' id='"+value["url"]+"'><i class='ion-close-circled'></i> <progress style='background:silver;' disable=disable value='0' max='0'></progress> " + value["regex"] + " <script type='json'>"+JSON.stringify(value)+"</script></div>");
          }
            __datatemp.push(value["url"]);
          }
          });
    });
  });
}
getallformxml();

function func_contextmenu(element){
  const menu = new Menu();
  var self = element;
  var value = JSON.parse(self.querySelector('script').innerHTML);
  menu.append(new MenuItem(
    {role: 'copy',
    submenu: [
      {label:"URL",click() { 
        // copy item url found from list
        clipboard.writeText(value['url']); 
      }},
      {label: 'Regex', click() { 
        // copy item regex found from list
        clipboard.writeText(value['regex']); 
      }}
  ] }));

  // menu.append(new MenuItem({type: 'separator'}));
  // menu.append(new MenuItem({role: 'delete', click() { 
  //   switch(self.className){
  //     case "find_file find_yes":
  //       num_scu--;
  //     break;
  //     case "find_file find_no":
  //       num_err--;
  //     break;
  //     default:
  //       return;
  //   }
  //   images_url.remove(value["url"]);
  //   self.parentElement.removeChild(self);
  // }}));  

  // menu.append(new MenuItem({label: 'Delete All', click() { 
  //   switch(self.className){
  //     case "find_file find_yes":
  //       num_scu--;
  //     break;
  //     case "find_file find_no":
  //       num_err--;
  //     break;
  //     default:
  //       return;
  //   }
  //   images_url.remove(value["url"]);
  //   self.parentElement.removeChild(self);
  // }}));
  menu.popup(remote.getCurrentWindow());
}


const InputMenu = Menu.buildFromTemplate([{
        label: 'Undo',
        role: 'undo',
    }, {
        label: 'Redo',
        role: 'redo',
    }, {
        type: 'separator',
    }, {
        label: 'Cut',
        role: 'cut',
    }, {
        label: 'Copy',
        role: 'copy',
    }, {
        label: 'Paste',
        role: 'paste',
    }, {
        type: 'separator',
    }, {
        label: 'Select all',
        role: 'selectall',
    },
]);
setInterval(function(){
  $("#num_suc").html(num_scu);
  $("#num_err").html(num_err);
},50);
document.body.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();

    let node = e.target;

    while (node) {
        if (node.nodeName.match(/^(input|textarea)$/i) || node.isContentEditable) {
            InputMenu.popup(remote.getCurrentWindow());
            break;
        }
        node = node.parentNode;
    }
});