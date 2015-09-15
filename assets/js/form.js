(function(UNBOUNDID, $, undefined) {

  // add the has-error class for any form groups containing required fields without values
  UNBOUNDID.flagMissingValues = function(form) {
    var hasMissingValues = false;
    form.find('input.required').each(function() {
      var input = $(this);
      if (input.val() === '') {
        UNBOUNDID.flagValue(input);
        hasMissingValues = true;
      }
    });
    return hasMissingValues;
  };

  // flags the password/confirm password field matching the given selectors if
  //  they do not match
  UNBOUNDID.flagPassword = function(jqForm, passwordSelector, confirmSelector) {
    var password = jqForm.find(passwordSelector || '#password');
    var confirmPassword = jqForm.find(confirmSelector || '#confirm_password');
    if (password.val() !== confirmPassword.val()) {
      UNBOUNDID.flagValue(password);
      UNBOUNDID.flagValue(confirmPassword);
      return true;
    }
    return false;
  };

  // flags the given input via the form-group's has-error class
  UNBOUNDID.flagValue = function(input, isValid) {
    input.closest('.form-group').toggleClass('has-error', ! isValid);
  };

  // "unflags" inputs on the given form
  UNBOUNDID.unflagValues = function(form) {
    form.find('.form-group').removeClass('has-error');
  };

  // converts the given "SCIM form" to a JSON representation
  UNBOUNDID.scimFormToJson = function(form) {
    var schemas = [ 'urn:scim:schemas:core:1.0' ];
    var json = {};
    form.find('input[data-scim]').each(function() {
      var el = $(this);
      // skip empty values
      var val = el.val();
      if (val === '') {
        return;
      }
      // parse the SCIM string into the components we are interested in
      var name = el.data('scim');
      var schema = null;
      var canonicalValue = null;
      // pull out the schema (if any)
      var index = name.lastIndexOf(':');
      if (index !== -1) {
        schema = name.substring(0, index);
        name = name.substring(index + 1);
      }
      // pull out the canonical value (if any)
      index = name.indexOf('[');
      if (index !== -1) {
        var closeIndex = name.indexOf(']', index);
        if (closeIndex !== -1) {
          canonicalValue = name.substring(index + 1, closeIndex)
        }
      }
      // handle the schema
      var container = json;
      if (schema) {
        // add it to the list if necessary
        if ($.inArray(schema, schemas) === -1) {
          schemas.push(schema);
        }
        // if it isn't the core schema we need to put this attribute in a schema container
        if (schema.indexOf('urn:scim:schemas:core') !== 0) {
          container[schema] = container[schema] || {};
          container = container[schema];
        }
      }
      // split the attribute name by periods and brackets, and process...
      var nameArray = name.split(/\.|\[|\]\./);
      if (nameArray.length > 1) {
        var parent = container;
        for (var i = 0; i < nameArray.length; i++) {
          var entry = nameArray[i];
          if (i === nameArray.length - 1) {
            // last one is the actual name
            name = entry;
          }
          else if (canonicalValue && entry === canonicalValue) {
            // special handling for multi-valued attributes
            if (!(container instanceof Array)) {
              // the multi-valued attribute should be an array, not an object
              container = parent[nameArray[i - 1]] = [];
            }
            var value = null;
            for (var j = 0; j < container.length; j++) {
              if (container[j].type && container[j].type === canonicalValue) {
                value = container[j];
                break;
              }
            }
            if (!value) {
              value = { type: canonicalValue };
              container.push(value);
            }
            container = value;
          }
          else {
            // we need to go in another level
            container[entry] = container[entry] || {};
            parent = container;
            container = container[entry];
          }
        }
      }
      container[name] = val;
    });
    json["schemas"] = schemas;
    return JSON.stringify(json, null, 2);
  };

  // wires the password popover and validation
  UNBOUNDID.wirePasswordPopover = function(fieldSelector, popoverTemplateSelector) {
    // only wire it up if both the field and popover template are found on the page
    var field = $(fieldSelector || '#password');
    var popoverTemplate = $(popoverTemplateSelector || '#password_requirements_template');
    if (field.length && popoverTemplate.length) {
      field.focus(function() {
        // create the popover
        $(this).popover({
          html: true,
          placement: 'top',
          trigger: 'manual',
          title: 'Password Requirements',
          content: function() {
            return popoverTemplate.html();
          }, 
        }).popover('show');
        // validate the field
        validatePassword(field);
      });
      field.blur(function() {
        // hide the popover
        $(this).popover('hide');
      });
      field.keyup(function() {
        // validate the field
        validatePassword(field);
      });
      field.change(function() {
        // validate the field
        validatePassword(field);
      });
    }
  };

  // handle client-side validation
  function validatePassword(field) {
    var value = field.val();
    // process the list of displayed password requirements
    $('div.popover.in div[data-requirement]').each(function() {
      var el = $(this);
      var requirement = el.data('requirement');
      var isValid = null;
      if (requirement === 'length') {
        isValid = validatePasswordLength(value, el);
      }
      else if (requirement === 'unique-characters') {
        isValid = validatePasswordUniqueChars(value, el);
      }
      else if (requirement === 'repeated-characters') {
        isValid = validatePasswordRepeatedChars(value, el);
      }
      else if (requirement === 'character-set') {
        isValid = validatePasswordCharSet(value, el);
      }
      if (isValid !== null) {
        var icon = el.find('.glyphicon');
        el.toggleClass('req-unknown', false);
        icon.toggleClass('glyphicon-question-sign', false);
        el.toggleClass('req-ok', isValid);
        icon.toggleClass('glyphicon-ok-sign', isValid);
        el.toggleClass('req-missing', ! isValid);
        icon.toggleClass('glyphicon-remove-sign', ! isValid);
      }
    });
  }

  // validate the password meets the length requirements
  function validatePasswordLength(password, requirementEl) {
    var length = password !== null ? password.length : 0;
    var min = requirementEl.data('min-password-length');
    var max = requirementEl.data('max-password-length');
    return (!min || length >= min) && (!max || length <= max);
  }

  // validate the password has the required number of unique characters
  function validatePasswordUniqueChars(password, requirementEl) {
    var min = requirementEl.data('min-unique-characters');
    var caseSensitive = requirementEl.data('case-sensitive-validation');
    var unique = '';
    if (password !== null) {
      for (var i = 0; i < password.length; i++) {
        var check = password[i];
        check = caseSensitive ? check : check.toLowerCase();
        if (unique.indexOf(check) === -1){
          unique += check;
        }
      }
    }
    return (!min || unique.length >= min);
  }

  // validate the password does not have too many repeated characters
  function validatePasswordRepeatedChars(password, requirementEl) {
    var max = requirementEl.data('max-consecutive-length');
    var caseSensitive = requirementEl.data('case-sensitive-validation');
    var sets = [], i = 1, j, chars, check, last = null, count = 1;
    while (1) {
      chars = requirementEl.attr('data-character-set-' + i);
      if (! chars) {
        break;
      }
      sets.push(caseSensitive ? chars : chars.toLowerCase());
      i++;
    }
    if (! password) {
      return null;
    }
    for (i = 0; i < password.length; i++) {
      check = password[i];
      check = caseSensitive ? check : check.toLowerCase();
      for (j = 0; j < sets.length; j++) {
        if (sets[j].indexOf(check) !== -1) {
          check = sets[j];
          break;
        }
      }
      if (check === last) {
        count++;
      }
      else {
        last = check;
        count = 1;
      }
      if (count > max) {
        return false;
      }
    }
    return true;
  }

  // validate the password contains the required count from each character set
  function validatePasswordCharSet(password, requirementEl) {
    var allowUnclassified = requirementEl.data('allow-unclassified-characters');
    var sets = [], i = 1, j, chars, min, check, found;
    while (1) {
      chars = requirementEl.attr('data-set-' + i + '-characters');
      if (! chars) {
        break;
      }
      i++; // TODO: remove if the characters and min-count are changed to share the same index in data returned...
      min = parseInt(requirementEl.attr('data-set-' + i + '-min-count'));
      sets.push( { 'chars': chars, 'min': min, 'count': 0 } );
      i++;
    }
    if (sets.length === 0) {
      return null;
    }
    else if (! password) {
      return false;
    }
    for (i = 0; i < password.length; i++) {
      check = password[i];
      found = false;
      for (j = 0; j < sets.length; j++) {
        if (sets[j].chars.indexOf(check) !== -1) {
          sets[j].count++;
          found = true;
        }
      }
      if (! found && ! allowUnclassified) {
        return false;
      }
    }
    for (i = 0; i < sets.length; i++) {
      if (sets[i].count < sets[i].min) {
        return false;
      }
    }
    return true;
  }

}(window.UNBOUNDID = window.UNBOUNDID || {}, jQuery));
