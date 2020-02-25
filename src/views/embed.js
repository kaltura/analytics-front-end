let config = {
  kalturaServer: {
    uri: 'www.kaltura.com',
    previewUIConf: 38524931,
  },
  cdnServers: {
    serverUri: 'http://cdnapi.kaltura.com',
    securedServerUri: 'https://cdnapisec.kaltura.com'
  },
  ks: '', // provide ks
  pid: '', // provide partnerId
  locale: 'en',
  live: {
    pollInterval: 30,
    healthNotificationsCount: 50,
  },
  menuConfig: {
    showMenu: false,
  },
  customStyle: {
    baseClassName: 'hack20',
    css: `
             body.hack20 {
                background: transparent;
                background-color: white;
            }
            .hack20 .kMain .kReportView .kReport .kFilters, .hack20 .kTotalsContainer {
                background-color: white !important;
            }
            .hack20 .kMain .kReportView .kReport .kReportHeader {
                background: transparent;
            }
            .hack20 .kMain .kReportView .kReport .kReportHeader app-date-filter{
                margin-left: auto;
            }
            .hack20 .kMain .kReportView .kReport .kReportContainer {
                background: transparent;
            }
            .hack20 .kMain .kReportView .kReport, .hack20 .kMain .kReportView .kReport .kDivider {
                background: transparent;
            }
            .hack20 .kTableToggle {
                display: none !important;
            }
            /* Borders */
            .hack20 .kTotalContainer, .hack20 .kSocialHighlights {
                border: 1px solid #cccccc !important;
            }
            .hack20 .kTotalContainer:first-child {
                border-top-left-radius: 3px;
                border-bottom-left-radius: 3px;
            }
            .hack20 .kTotalContainer:last-child {
                border-top-right-radius: 3px;
                border-bottom-right-radius: 3px;
                border-left: none !important;
            }
            .hack20 .kTotalContainer:not(:first-child):not(:last-child) {
                border-left: none !important;
            }`
  }
};

function showLogin(){
  $("#login").show();
}

function hideLogin(){
  $("#login").hide();
}

function showAlert(t){
  $('.alert-text').text(t);
  $('#alert-layer').show();
}

function login(){
  $(".error").text('');
  $('#login-button').addClass("disabled");
  const user = $('#user').val();
  const pass = $('#pass').val();
  if (pass.length > 20 && parseInt(user).toString() === user){ // KS - try login by KS
    loginByKs(user, pass);
  } else {
    $.post("https://www.kaltura.com/api_v3/service/user/action/loginByLoginId", {
      format: 1,
      loginId: user,
      password: pass
    }, function (data) {
      $('#login-button').removeClass("disabled");
      if (data.message) {
        $(".error").text(data.message);
      } else {
        getUsername(data);
        config.ks = data;
      }
    });
  }
}

function getUsername(ks){
  $(".error").text('');
  $.post( "https://www.kaltura.com/api_v3/service/user/action/getByLoginId", {
    ks: ks,
    format: 1,
    loginId: $('#user').val()
  }, function( data ) {
    if (data.message){
      $(".error").text(data.message);
    } else {
      config.pid = data.partnerId;
      // save session in local storage
      saveSession();
      // load Analytics
      loadAnalytics();
    }
  })
}

function saveSession(){
  const kData = {
    pid: config.pid,
    ks: config.ks
  };
  window.localStorage.setItem('kData', JSON.stringify(kData));
}

function updateConfig(data){
  config.ks = data.ks;
  config.pid = data.partnerId;
  // save session in local storage
  saveSession();
}

function loadAnalytics(){
  hideLogin();
  $("#analytics").attr("src", "https://il-kmc-ng.dev.kaltura.com/hack20/apps/analytics-v1.12.1/index.html");
}

function loginByKs(pid, ks) {
  $.post( "https://www.kaltura.com/api_v3/service/user/action/loginByKs", {
    ks: ks,
    format: 1,
    requestedPartnerId: pid
  },  data => {
    if (data.ks && data.partnerId) {
      updateConfig(data);
      // load Analytics
      loadAnalytics();
    } else {
      showLogin();
    }
  });
}
// load ks and pid from local storage
const kData = JSON.parse(window.localStorage.getItem('kData'));
if (!kData || !kData.ks){ // no ks stored in local storage
  showLogin();
} else {
  // ks found - check that it is valid
  loginByKs(kData.pid, kData.ks);
}

$.urlParam = function (name) {
  var results = new RegExp('[\?&]' + name + '=([^&#]*)')
    .exec(window.location.href);
  if (results == null) {
    return 0;
  }
  return results[1] || 0;
}

var input = document.getElementById("pass");
input.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    login();
  }
});
