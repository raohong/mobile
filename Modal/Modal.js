/**
 *
 */
(function($) {
  const noop = function() {};
  class ModalBase {
    constructor(options) {
      options = options || {};
      if (Object.prototype.toString.call(options) !== "[object Object]") {
        throw new TypeError("Modal options is not a object");
      }
      this.settings = Object.assign(
        {},
        {
          //modal, tips, toast
          type: "modal",
          className: "",
          title: "",
          body: "",
          amin: "modal-fade-in",
          amout: "modal-fade-out",
          sureText: "确定",
          cancelText: "取消",
          timeout: 1500,
          sureCallback: noop,
          cancelCallback: noop,
          closeCallback: noop
        },
        options
      );
      this.show = this.show.bind(this);
      this.destroy = this.destroy.bind(this);
      this.setLoading = this.setLoading.bind(this);
      this.close = this.close.bind(this);
      this.init();
    }
    init() {
      const amin = this.settings.amin,
        type = this.settings.type,
        _this = this,
        timeout = this.settings.timeout;
      this.renderDOM();
      const modal = this.modal;
      modal.hide();
      $("body").append(modal);
      this.show();
      modal.data("modal", this);
    }
    renderDOM() {
      const settings = this.settings;
      const type = settings.type;
      this.modal = $(
        `<div data-type="${type}"  class="modal-${type} modal-container${
          settings.className ? " " + settings.className : ""
        }"></div>`
      );
      let html = ``;
      if (type === "modal") {
        html += `<div class="modal-mask"></div>`;
      }
      html += `<div class="modal-content">`;
      if (type === "modal") {
        html += `<div class="modal-header"><h2 class="modal-title">${
          settings.title
        }</h2></div>`;
      }

      html += `<div class="modal-body">${settings.body}</div>`;
      if (type === "modal") {
        html += `<div class="modal-footer"><a href="javsacript:;" class="modal-btn modal-cancel">${
          settings.cancelText
        }</a><a href="javascript:;"  class="modal-btn modal-sure">${
          settings.sureText
        }</a></div>`;
      }
      html += `</div>`;
      this.modal.html(html);
    }
    show() {
      const amin = this.settings.amin,
        type = this.settings.type,
        _this = this,
        timeout = this.settings.timeout,
        modal = this.modal;
      modal.show();
      modal.one("animationend webkitAnimationEnd mozAnimationEnd", function() {
        this.classList.remove(amin);
        if (type !== "modal") {
          setTimeout(function() {
            _this.destroy();
          }, timeout);
        }
      });
      modal.addClass(amin);
    }
    close(cb) {
      const amout = this.settings.amout,
        _this = this,
        modal = this.modal;
      modal.on("animationend webkitAnimationEnd mozAnimationEnd", function() {
        this.classList.remove(amout);
        modal.hide();
        if (typeof cb === "function") {
          cb(modal);
        } else {
          _this.settings.closeCallback();
        }
      });
      modal.addClass(amout);
    }
    sure() {
      const sureCallback = this.settings.sureCallback;
      if (sureCallback === noop) {
        this.close(sureCallback);
      } else {
        sureCallback();
      }
    }
    cancel() {
      const cancelCallback = this.settings.cancelCallback;
      if (cancelCallback === noop) {
        this.close(cancelCallback);
      } else {
        cancelCallback();
      }
    }
    setLoading(isLoading) {
      isLoading = isLoading || false;
    }
    destroy() {
      this.close(function(modal) {
        modal.remove();
      });
    }
  }
  ModalBase.init = function() {
    $("body").on("click", ".modal-container .modal-cancel", function() {
      const btn = $(this),
        modal = btn.closest(".modal-container");
      const instance = modal.data("modal");
      if (instance) {
        instance.cancel();
      }
    });
    $("body").on("click", ".modal-container .modal-sure", function() {
      const btn = $(this),
        modal = btn.closest(".modal-container");
      const instance = modal.data("modal");
      if (instance) {
        instance.sure();
      }
    });
    $("body").on("click", ".modal-container .modal-mask", function() {
      const btn = $(this),
        modal = btn.closest(".modal-container");
      const instance = modal.data("modal");
      if (instance) {
        instance.close();
      }
    });
  };
  $(function() {
    ModalBase.init();
  });
  function Modal(options) {
    return Modal.modal(options);
  }
  ["modal", "tips", "toast"].forEach(function(key) {
    let upperCaseKey = key.toUpperCase() + key.slice(1);
    Modal[key] = Modal[upperCaseKey] = function(options) {
      if (key === "tips" || key === "toast") {
        if (typeof options === "string") {
          options = {
            body: options
          };
        }
      } else {
        options = options || {};
      }
      options.type = key;
      const modal = new ModalBase(options);
      return {
        destroy: modal.destroy,
        close: modal.close,
        setLoading: modal.setLoading,
        show: modal.show
      };
    };
  });
  window.Modal = Modal;
})(jQuery);
