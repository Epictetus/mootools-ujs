/**
 * Rails unobtrusive JS proof of concept.
 *
 * TODO: Update driver with the latest API
 *    - Encapsulate ajax:before to stop the request on falsy return values
 *    - When ajax:before can stop the request from being sent,
 *      add data-confirm, and move out data-disable-with from Request.Rails.
 *
 * TODO: Tests
 */

window.addEvent('domready', function() {
  var getCsrf = function(name) {
    var meta = document.getElement('meta[name=csrf-' + name + ']');
    return (meta ? meta.get('content') : null);
  };

  var csrf = {
    token: getCsrf('token'),
    param: getCsrf('param')
  };

  var handleRemote = function(e) {
    e.preventDefault();
    this.railsRequest = new Request.Rails(this).send();
  };

  $$('form[data-remote="true"]').addEvent('submit', handleRemote);
  $$('a[data-remote="true"], input[data-remote="true"], input[data-remote-submit="true"]').addEvent('click', handleRemote);
  $$('a[data-method][data-remote!=true]').addEvent('click', function(e) {
    e.preventDefault();

    var form = new Element('form', {
      method: 'post',
      action: this.get('href'),
      styles: { display: 'none' }
    }).inject(this, 'after');
    
    var methodInput = new Element('input', {
      type: 'hidden',
      name: '_method',
      value: this.get('data-method')
    });

    var csrfInput = new Element('input', {
      type: 'hidden',
      name: csrf.param,
      value: csrf.token
    });

    form.adopt(methodInput, csrfInput).submit();
  });
});

(function($) {
  Request.Rails = new Class({

    Extends: Request,

    initialize: function(element, options) {
      this.el = element;
      this.parent($merge({
        method: this.el.get('method') || this.el.get('data-method') || 'get',
        url: this.el.get('action') || this.el.get('href')
      }, options));
      this.headers.Accept = '*/*';

      this.addRailsEvents();
    },

    send: function(options) {
      if(!this.checkConfirm()) {
        return;
      }
      this.el.fireEvent('ajax:before');
      if(this.el.get('tag') == 'form') {
        this.options.data = this.el;
      }
      this.parent(options);
      this.el.fireEvent('ajax:after', this.xhr);
    },

    addRailsEvents: function() {
      this.addEvent('request', function() {
        this.el.fireEvent('ajax:loading', this.xhr);
      });

      this.addEvent('success', function() {
        this.el.fireEvent('ajax:success', this.xhr);
      });

      this.addEvent('complete', function() {
        this.el.fireEvent('ajax:complete', this.xhr);
        this.el.fireEvent('ajax:loaded', this.xhr);
      });

      this.addEvent('failure', function() {
        this.el.fireEvent('ajax:failure', this.xhr);
      });

      this.setDisableWith();
    },

    checkConfirm: function() {
      var confirmMessage = this.el.get('data-confirm');
      if(confirmMessage && !confirm(confirmMessage)) {
        return false;
      }
      return true;
    },

    setDisableWith: function() {
      var button = this.el.get('data-disable-with') ? this.el : this.el.getElement('[data-disable-with]');
      if(!button) {
        return;
      }

      var disableWith = button.get('data-disable-with');
      if(disableWith) {
        var enableWith = button.get('value');

        this.el.addEvent('ajax:before', function() {
          button.set({
            value: disableWith,
            disabled: true
          });
        }).addEvent('ajax:complete', function() {
          button.set({
            value: enableWith,
            disabled: false
          });
        });
      }
    }
  });

})(document.id);

/**
 * MooTools selector engine does not match data-* attributes.
 * This will be fixed in 1.3, when the engine is swapped for Slick.
 */
Selectors.RegExps.combined = (/\.([\w-]+)|\[([\w-]+)(?:([!*^$~|]?=)(["']?)([^\4]*?)\4)?\]|:([\w-]+)(?:\(["']?(.*?)?["']?\)|$)/g);
