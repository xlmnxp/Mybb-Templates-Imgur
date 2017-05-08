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

function uploadall(_this){
  getallformxml();
  $(_this).attr('disabled','disabled');
  $("#refreshbtn").attr('disabled','disabled');

  setTimeout(function(){
    if(images_url.length == 0){
      $(_this).removeAttr('disabled');
      $("#refreshbtn").removeAttr('disabled');
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
                    });
                      
                  }
              })
              .catch(function (err) {
                  dialog.showErrorBox("Error",err.message);
                  $("#remaining").html(parseInt(0));
                  $(_this).removeAttr('disabled');
                  $("#refreshbtn").removeAttr('disabled');
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






var num_errers = 0
   ,num_succes = 0
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
  num_succes = 0;
  num_errers = 0;
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
            num_succes = num_succes + 1;
            $("#viewer").html($("#viewer").html()+"<div oncontextmenu='func_contextmenu(this);' class='find_file find_yes' id='num_"+num_succes+"'><i class='ion-checkmark-circled'></i> <progress value='0' max='2'></progress> " + value["url"] + " <script type='json'>"+JSON.stringify(value)+"</script></div>");
            images_url.push(value["url"]);
          }else {
            num_errers = num_errers + 1;
            $("#viewer").html($("#viewer").html()+"<div oncontextmenu='func_contextmenu(this);' class='find_file find_no' id='"+value["url"]+"'><i class='ion-close-circled'></i> <progress style='background:silver;' disable=disable value='0' max='0'></progress> " + value["regex"] + " <script type='json'>"+JSON.stringify(value)+"</script></div>");
          }
            $("#num_suc").html(num_succes);
            $("#num_err").html(num_errers);
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
  menu.append(new MenuItem({label: 'Copy URL', click() { 
    // copy item url found from list
    clipboard.writeText(value['url']); 
  }}));
  menu.append(new MenuItem({label: 'Copy Regex', click() { 
    // copy item regex found from list
    clipboard.writeText(value['regex']); 
  }}));
  menu.append(new MenuItem({type: 'separator'}));
  
  menu.append(new MenuItem({label: 'Remove', click() { 
    // remove item form list 
  }}));  
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