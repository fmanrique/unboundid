(function(UNBOUNDID, $, undefined) {

  UNBOUNDID.areCookiesEnabled = function() {
    var cookiesEnabled = navigator.cookieEnabled;
    if (typeof cookiesEnabled == 'undefined') {
      document.cookie = 'UNBOUNDID.areCookiesEnabled';
      cookiesEnabled = document.cookie.indexOf('UNBOUNDID.areCookiesEnabled') != -1;
      if (cookiesEnabled) {
        document.cookie = 'UNBOUNDID.areCookiesEnabled=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }
    }
    return cookiesEnabled;
  };
  
  UNBOUNDID.addErrorMessage = function(message, panelSelector) {
    UNBOUNDID.addMessage(message, panelSelector, 'alert-danger');
  };

  UNBOUNDID.addWarningMessage = function(message, panelSelector) {
    UNBOUNDID.addMessage(message, panelSelector, 'alert-warning');
  };

  var defaultPanelSelector = '#alerts_panel';
  UNBOUNDID.addMessage = function(message, panelSelector, type) {
    panelSelector = panelSelector || defaultPanelSelector;
    type = type || 'alert-danger';
    var alert = $('<div class="alert fade in ' + type +
        '"><button class="close" data-dismiss="alert">X</button><div class="message"></div></div>');
    alert.find('.message').text(message);
    $(panelSelector).append(alert);
  };

  UNBOUNDID.clearMessages = function(panelSelector) {
    panelSelector = panelSelector || defaultPanelSelector;
    $(panelSelector).find('div.alert').remove();
  };

}(window.UNBOUNDID = window.UNBOUNDID || {}, jQuery));