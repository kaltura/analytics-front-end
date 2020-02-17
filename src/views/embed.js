const config = {
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
            .hack20 .kMain .kReportView .kReport .kFilters {
                background-color: white;
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
            .hack20 .kTable {
                display: none !important;
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
  $.post( "https://www.kaltura.com/api_v3/service/user/action/loginByLoginId", {
    format: 1,
    loginId: user,
    password: pass
  }, function( data ) {
    $('#login-button').removeClass("disabled");
    if (data.message){
      $(".error").text(data.message);
    } else {
      getUsername(data);
      config.ks = data;
    }
  });
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

// load ks and pid from local storage
const kData = JSON.parse(window.localStorage.getItem('kData'));
if (!kData || !kData.ks){ // no ks stored in local storage
  showLogin();
} else {
  // ks found - check that it is valid
  $.post( "https://www.kaltura.com/api_v3/service/user/action/loginByKs", {
    ks: kData.ks,
    format: 1,
    requestedPartnerId: kData.pid
  },  data => {
    if (data.ks && data.partnerId) {
      updateConfig(data);
      // load Analytics
      loadAnalytics();
    } else {
      showLogin();
    }
  })
}
