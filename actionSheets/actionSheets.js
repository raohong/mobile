(function($) {
  const utils = {
    one(el, cb) {
      el.one("transitionend webkitAnimationEnd mozAnimationEnd", function() {
        typeof cb === "function" && cb(el);
      });
    }
  };
  class ActionSheets {
    constructor(el) {
      if (el.data("action-sheets")) {
        return el.data("action-sheets");
      }
      this.el = el;
      this.show = this.show.bind(this);
      this.hide = this.hide.bind(this); 
      this.init();
      this.el.data("action-sheets", this);
    }
    init() {
      const el = this.el;
      this.mask = el.find(".mask");
      this.wrapper = el.find(".action-sheets-wrapper");
      el.hide();
      this.mask.hide();
      this.wrapper.hide();
    }

    show(cb) {
      const _this = this;
      this.el.show();
      this.mask.show().css({ opacity: 1 });
      this.wrapper.show();
      utils.one(this.wrapper, function() {
        typeof cb === "function" && cb(_this.el);
      });
      this.wrapper.css({
        transform: "translateY(0)",
        "-webkit-transform": "translateY(0)"
      });
    }
    hide(cb) {
      const el = this.el;
      utils.one(this.mask, function(mask) {
        mask.hide();
      });
      this.mask.css({ opacity: 0 });

      utils.one(this.wrapper, function(wrapper) {
        wrapper.hide();
        el.hide();
        typeof cb === "function" && cb(el);
      });
      this.wrapper.css({
        transform: "translateY(100%)"
      });
    }
  }
  $.fn.actionSheets = function(action = "") {
    $(this).each(function() {
      var sheets = $(this),
        data = sheets.data("action-sheets");
      if (!data) {
        sheets.data("action-sheets", (data = new ActionSheets(sheets)));
      }
      if (action && /^(?:show|hide)$/) {
        data[action]();
      }
    });
    return this;
  };
  ActionSheets.init = function() {
    $(`[data-role="action-sheets"]`).each(function() {
      var sheets = $(this),
        data = sheets.data("action-sheets");
        console.log(data)
      if (!data) {
        sheets.data("action-sheets", new ActionSheets(sheets));
      }
    });

    $("body").on(
      "click",
      `[data-role="action-sheets"] .mask, [data-role="action-sheets"] .action-sheets-cancel`,
      function(e) {
        var sheets = $(this).closest('[data-role="action-sheets"]');
        var data = sheets.data("action-sheets");
        if (data) {
          data.hide();
        }
        e.stopPropagation();
      }
    );
  };
  $(function() {
    ActionSheets.init();
  });
  window.ActionSheets = ActionSheets;
})(jQuery);
