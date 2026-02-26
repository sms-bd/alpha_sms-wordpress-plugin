<?php
// If this file is called directly, abort.
if (! defined('WPINC')) {
    die;
}
?>

<div id="alpha-sms-checkout-otp-wrapper" class="alpha-sms-otp-panel" style="display:none;">
    <div class="alpha-sms-otp-panel-inner">
        <h4 class="alpha-sms-otp-title"><?php esc_html_e('Phone Verification', 'alpha-sms'); ?></h4>
        <div id="alpha-sms-otp-status"></div>
        <div id="alpha-sms-otp-send-step">
            <p class="alpha-sms-otp-desc"><?php esc_html_e('Please verify your phone number to complete your order.', 'alpha-sms'); ?></p>
            <button type="button" id="alpha-sms-send-otp-btn" class="button alpha-sms-btn">
                <?php esc_html_e('Send Verification Code', 'alpha-sms'); ?>
            </button>
        </div>
        <div id="alpha-sms-otp-verify-step" style="display:none;">
            <label for="alpha-sms-otp-code"><?php esc_html_e('Enter OTP Code', 'alpha-sms'); ?></label>
            <input type="number" id="alpha-sms-otp-code" class="input-text" placeholder="<?php esc_attr_e('Enter 6-digit code', 'alpha-sms'); ?>" maxlength="6" />
            <div id="alpha-sms-otp-countdown"></div>
            <button type="button" id="alpha-sms-verify-otp-btn" class="button alpha-sms-btn">
                <?php esc_html_e('Verify', 'alpha-sms'); ?>
            </button>
        </div>
        <div id="alpha-sms-otp-verified" style="display:none;">
            <span class="alpha-sms-verified-badge">&#10003; <?php esc_html_e('Phone verified — you may place your order.', 'alpha-sms'); ?></span>
        </div>
    </div>
</div>
