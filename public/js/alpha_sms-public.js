/* For Woocommerce page login and registration code */

window.$ = jQuery;

let form,
   wc_reg_form,
   alert_wrapper,
   otp_input,
   otp_input_reg;

// fill variables with appropriate selectors and attach event handlers
$(function () {
   alert_wrapper = $('.woocommerce-notices-wrapper').eq(0);

   otp_input = $('#alpha_sms_otp');
   otp_input_reg = $('#alpha_sms_otp_reg');

   // Perform AJAX login on form submit
   if (otp_input.length) {
      form = otp_input.parent('form.woocommerce-form-login.login');
      form.find(':submit').on('click', WC_Login_SendOtp);
   }

   if (otp_input_reg.length) {
      wc_reg_form = otp_input_reg.parent('form.woocommerce-form-register.register');
      wc_reg_form.find(':submit').on('click', WC_Reg_SendOtp);
   }

   // Universal checkout OTP panel (works with any theme / checkout mode)
   alphaSmsCheckoutOtp.init();
});

// Error template
function showError(msg) {
   return `<ul class="woocommerce-error" role="alert"><li>${msg}</li></ul></div>`;
}

// Error template
function showSuccess(msg) {
   return `<ul class="woocommerce-message" role="alert" style="border-left: 3px solid #00a32a"><li>${msg}</li></ul></div>`;
}

// ajax send otp for woocommerce login
function WC_Login_SendOtp(e) {
   if (e) e.preventDefault();
   alert_wrapper.html('');

   let username = form.find('#username').val();
   let password = form.find('#password').val();

   if (!username || !password) {
      alert_wrapper.html(showError('Fill in the required fields.'));
      $('html,body').animate({ scrollTop: 0 }, 'slow');
      return;
   }

   form
      .find(':submit')
      .prop('disabled', true)
      .val('Processing')
      .text('Processing');

   let data = {
      action: 'alpha_sms_to_save_and_send_otp_login', //calls wp_ajax_nopriv_alpha_sms_to_save_and_send_otp_login
      log: form.find('#username').val(),
      pwd: form.find('#password').val(),
      rememberme: form.find('#rememberme').val(),
      alpha_sms: form.find('#alpha_sms').val(),
   };

   $.post(
      alpha_sms_object.ajaxurl,
      data,
      function (resp) {
         if (resp.status === 200) {
            form.find(':submit').off('click');
            $('#alpha_sms_otp').fadeIn().prevAll().hide();
            alert_wrapper.html(showSuccess(resp.message));
            timer(
               'resend_otp',
               120,
               `<a href="javascript:WC_Login_SendOtp()">Resend OTP</a>`
            );
         } else if (resp.status === 402) {
            // no phone number found
            form.find(':submit').off('click');
            form.find(':submit').prop('disabled', false).val('Log In').trigger('click');

         } else {
            // wrong user name pass/sms api error
            alert_wrapper.html(showError(resp.message));
         }
      },
      'json'
   )
      .fail(() =>
         alert_wrapper.html(
            showError('OTP verification request failed. Please try again later')
         )
      )
      .done(() =>
         form
            .find(':submit')
            .prop('disabled', false)
            .val('Log In')
            .text('Log In')
      );
}

// ajax send otp for woocommerce registration
function WC_Reg_SendOtp(e) {
   if (e) e.preventDefault();
   alert_wrapper.html('');

   let phone = wc_reg_form.find('#reg_billing_phone').val();
   let email = wc_reg_form.find('#reg_email').val() || '';
   let password = wc_reg_form.find('#reg_password').val();
   let wc_reg_phone_nonce = wc_reg_form.find('#wc_reg_phone_nonce').val();
   let action_type = wc_reg_form.find('#action_type').val();

   if (!phone) {
      alert_wrapper.html(showError('Fill in the required fields.'));
      $('html,body').animate({ scrollTop: 0 }, 'slow');
      return;
   }

   wc_reg_form
      .find(':submit')
      .prop('disabled', true)
      .val('Processing')
      .text('Processing');

   let data = {
      action: 'wc_send_otp', //calls wp_ajax_nopriv_wc_send_otp
      billing_phone: phone,
      email: email,
      wc_reg_phone_nonce: wc_reg_phone_nonce,
      action_type: action_type,
   };

   if (password) {
      data.password = password;
   }

   $.post(
      alpha_sms_object.ajaxurl,
      data,
      function (resp) {
         if (resp.status === 200) {
            wc_reg_form.find(':submit').off('click');
            $('#alpha_sms_otp_reg').fadeIn().prevAll().hide();
            alert_wrapper.html(showSuccess(resp.message));
            timer(
               'wc_resend_otp',
               120,
               `<a href="javascript:WC_Reg_SendOtp()">Resend OTP</a>`
            );
         } else {
            // wrong user name pass/sms api error
            alert_wrapper.html(showError(resp.message));
         }
      },
      'json'
   )
      .fail(() =>
         alert_wrapper.html(
            showError('Something went wrong. Please try again later')
         )
      )
      .done(() =>
         wc_reg_form
            .find(':submit')
            .prop('disabled', false)
            .val('Register')
            .text('Register')
      );
}

/**
 * Universal checkout OTP verification module.
 *
 * Renders a self-contained verification panel (injected via wp_footer) that
 * is completely independent of the checkout form structure. Works with:
 * - WooCommerce classic checkout (shortcode)
 * - WooCommerce block-based checkout
 * - Custom Elementor / page-builder checkout pages
 * - Any theme
 */
var alphaSmsCheckoutOtp = {
   verified: false,
   panel: null,

   init: function () {
      if (
         typeof alpha_sms_object === 'undefined' ||
         alpha_sms_object.checkout_otp !== 'yes'
      ) {
         return;
      }

      this.panel = $('#alpha-sms-checkout-otp-wrapper');
      if (!this.panel.length) {
         return;
      }

      this.panel.show();
      this.bindEvents();
   },

   /**
    * Try to find the billing phone value from the checkout form.
    * Uses multiple selectors to support classic, block, and custom themes.
    */
   findBillingPhone: function () {
      var selectors = [
         '#billing_phone',
         '#billing-phone',
         'input[name="billing_phone"]',
         'input[id*="billing"][id*="phone"]',
         'input[name*="billing"][name*="phone"]',
         '.wc-block-components-phone-number input',
         'input[autocomplete="tel"]',
         'input[type="tel"]',
      ];

      for (var i = 0; i < selectors.length; i++) {
         var el = $(selectors[i]);
         if (el.length) {
            var val = el.val();
            // Minimum 10 chars covers BD numbers (11 local / 13 with country code)
            if (val && val.replace(/\s/g, '').length >= 10) {
               return val;
            }
         }
      }

      return '';
   },

   sendOtp: function () {
      var phone = this.findBillingPhone();
      if (!phone) {
         this.showMessage(
            'Please fill in your phone number in the checkout form first.',
            'error'
         );
         return;
      }

      var self = this;
      $('#alpha-sms-send-otp-btn').prop('disabled', true).text('Sending…');

      $.post(
         alpha_sms_object.ajaxurl,
         {
            action: 'wc_send_otp',
            billing_phone: phone,
            action_type: 'wc_checkout',
            alpha_sms_checkout_nonce:
               alpha_sms_object.alpha_sms_checkout_nonce,
         },
         function (resp) {
            if (resp.status === 200) {
               self.showMessage(resp.message, 'success');
               $('#alpha-sms-otp-send-step').hide();
               $('#alpha-sms-otp-verify-step').fadeIn();
               timer(
                  'alpha-sms-otp-countdown',
                  120,
                  '<a href="javascript:void(0)" class="alpha-sms-resend-link">Resend OTP</a>'
               );
            } else {
               self.showMessage(resp.message, 'error');
            }
         },
         'json'
      )
         .fail(function () {
            self.showMessage(
               'Something went wrong. Please try again.',
               'error'
            );
         })
         .always(function () {
            $('#alpha-sms-send-otp-btn')
               .prop('disabled', false)
               .text('Send Verification Code');
         });
   },

   verifyOtp: function () {
      var code = $('#alpha-sms-otp-code').val();
      if (!code) {
         this.showMessage('Please enter the OTP code.', 'error');
         return;
      }

      var phone = this.findBillingPhone();
      var self = this;

      $('#alpha-sms-verify-otp-btn').prop('disabled', true).text('Verifying…');

      $.post(
         alpha_sms_object.ajaxurl,
         {
            action: 'alpha_sms_verify_checkout_otp',
            otp_code: code,
            billing_phone: phone,
            alpha_sms_checkout_nonce:
               alpha_sms_object.alpha_sms_checkout_nonce,
         },
         function (resp) {
            if (resp.status === 200) {
               self.verified = true;
               self.showVerified();
            } else {
               self.showMessage(resp.message, 'error');
            }
         },
         'json'
      )
         .fail(function () {
            self.showMessage(
               'Verification failed. Please try again.',
               'error'
            );
         })
         .always(function () {
            $('#alpha-sms-verify-otp-btn')
               .prop('disabled', false)
               .text('Verify');
         });
   },

   showMessage: function (msg, type) {
      var cls =
         type === 'success'
            ? 'alpha-sms-msg-success'
            : 'alpha-sms-msg-error';
      $('#alpha-sms-otp-status').html(
         '<p class="' + cls + '">' + msg + '</p>'
      );
   },

   showVerified: function () {
      $('#alpha-sms-otp-send-step').hide();
      $('#alpha-sms-otp-verify-step').hide();
      $('#alpha-sms-otp-verified').fadeIn();
      $('#alpha-sms-otp-status').html('');
      this.panel.addClass('alpha-sms-verified');
   },

   bindEvents: function () {
      var self = this;
      $(document).on('click', '#alpha-sms-send-otp-btn', function () {
         self.sendOtp();
      });
      $(document).on('click', '#alpha-sms-verify-otp-btn', function () {
         self.verifyOtp();
      });
      $(document).on('click', '.alpha-sms-resend-link', function () {
         $('#alpha-sms-otp-verify-step').hide();
         $('#alpha-sms-otp-send-step').fadeIn();
         self.sendOtp();
      });
   },
};

function timer(displayID, remaining, timeoutEl) {
   timeoutEl = timeoutEl || '';
   var el = document.getElementById(displayID);
   if (!el) return;

   var m = Math.floor(remaining / 60);
   var s = remaining % 60;

   m = m < 10 ? '0' + m : m;
   s = s < 10 ? '0' + s : s;
   el.innerHTML = m + ':' + s;
   remaining -= 1;

   if (remaining >= 0) {
      setTimeout(function () {
         timer(displayID, remaining, timeoutEl);
      }, 1000);
      return;
   }
   // Do timeout stuff here
   el.innerHTML = timeoutEl;
}
