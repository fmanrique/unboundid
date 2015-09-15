(function(UNBOUNDID, $, undefined) {
  // NOTE: requires unboundid.js and form.js

	// toggle visibility of the login/register rows
	UNBOUNDID.showLogin = function(show) {
	  $('.login-row').toggle(show);
	  $('.register-row').toggle(!show);
	};

	// handles the IDP registration by updating the JSON in the hidden form field prior to submit
	UNBOUNDID.handleRegistration = function(form) {
	  // verify all fields flagged as required have values
	  var jqForm = $(form);
	  UNBOUNDID.unflagValues(jqForm);
	  if (UNBOUNDID.flagMissingValues(jqForm)) {
	    // early out
	    UNBOUNDID.clearMessages();
	    UNBOUNDID.addWarningMessage('Enter a value in all required fields (marked with "*").');
	    return false;
	  }
	  // convert the registration form field values into a SCIM resource JSON string
	  form.resource.value = UNBOUNDID.scimFormToJson(jqForm);
	  return true;
	};

	$(function() {
	  // highlight missing values on the registration form if needed
	  UNBOUNDID.flagMissingValues($('form[name="r"]'));

	  // hide registration/show sign-in if they click the link
	  $('.sign-in-link').click(function() {
	    UNBOUNDID.showLogin(true);
	  });

	  // initiate an IDP login if they click a link
	  $('.idp-login-link').click(function() {
	    var providerName = $(this).attr('title');
	    var idpLoginForm = $('#idpLoginForm');
	    idpLoginForm.find('input[name="idp"]').val(providerName);
	    idpLoginForm.submit();
	  });
	});

}(window.UNBOUNDID = window.UNBOUNDID || {}, jQuery));