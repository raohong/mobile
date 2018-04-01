(function() {
  const EventBus = function() {
    this.colls = {};

    this.on = function(type, cb) {
      if (!Array.isArray(this.colls[type])) {
        this.colls[type] = [];
      }
      this.colls[type].push({
        times: Infinity,
        cb
      });
    };
    this.once = function(type, cb) {
      if (!Array.isArray(this.colls[type])) {
        this.colls[type] = [];
      }
      this.colls[type].push({
        times: 1,
        cb
      });
    };
    this.off = function(type, cb) {
      const queue = this.colls[type];
      if (Array.isArray(queue)) {
        for (let i = 0, len = queue.length; i < len; i++) {
          if (queue[i] === cb) {
            queue.splice(i, 1);
            i--;
            len--;
          }
        }
      }
    };
    this.emit = function(type, ...rest) {
      const queue = this.colls[type];
      if (Array.isArray(queue)) {
        for (let i = 0, len = queue.length; i < len; i++) {
          let curr = queue[i];
          curr.times--;
          try {
            curr.cb(...rest);
          } catch (e) {
          } finally {
            if (curr.times === 0) {
              queue.splice(i, 1);
              i--;
              len--;
            }
          }
        }
      }
    };
  };
  const utils = {
    noop() {},
    addEvent(el, ...rest) {
      el.addEventListener(...rest);
      return function() {
        el.removeEventListener(...rest);
      };
    },
    addEventOne(el, type, handler) {
      const cb = function(e) {
        handler(e);
        el.removeEventListener(type, cb);
      };
      el.addEventListener(type, cb);
    },
    createElement(tag, props) {
      const el = document.createElement(tag);

      for (let key of Object.keys(props)) {
        let prop = props[key];
        if (key === "className") {
          el.className = Array.isArray(prop) ? prop.join(" ") : prop;
        } else if (key === "style") {
          for (let p in prop) {
            if (prop.hasOwnProperty(p)) {
              el.style[p] = prop[p];
            }
          }
        } else {
          el.setAttribute(key, prop);
        }
      }

      return el;
    },
    /**
     *
     * @param {event watcher} eventBus
     * @param {param option} option
     */
    genHandler(eventBus, option) {
      let startY = 0,
        diffY = 0,
        flag = false;
      const distinstace = option.distinstace;
      /**
       * pullFresh
       * cancelFresh
       * sureFresh
       *
       * pushLoad
       * sureLoad
       */
      let dir = "";
      return function(event) {
        const type = event.type;
        const el = event.currentTarget;
        const scrollTop = el.scrollTop,
          height = el.offsetHeight,
          scrollHeight = el.scrollHeight;

        let touches = event.touches[0];
        switch (type) {
          case "touchstart":
            if (scrollTop === 0 || scrollTop + height === scrollHeight) {
              flag = true;
              startY = touches.clientY;
              dir = scrollTop === 0 ? "down" : "up";
            }
            break;
          case "touchmove":
            diffY = touches.clientY - startY;
            if (
              flag &&
              ((dir === "down" && diffY > 0) || (dir === "up" && diffY < 0))
            ) {
              eventBus.emit(dir === "down" ? "pullFresh" : "pushLoad", {
                startY,
                diffY: Math.min(Math.abs(diffY), distinstace)
              });
            } else {
              flag = false;
              startY = 0;
              diffY = 0;
              dir = "";
            }

            break;
          case "touchend":
            touches = event.changedTouches[0];
            diffY = touches.clientY - startY;
            if (flag) {
              if (Math.abs(diffY) >= distinstace) {
                eventBus.emit(dir === "down" ? "sureFresh" : "sureLoad", {
                  startY,
                  diffY
                });
              } else {
                eventBus.emit(dir === "down" ? "cancelFresh" : "cancelLoad", {
                  startY,
                  diffY
                });
              }
            }
            flag = false;

            dir = "";
            diffY = 0;
            startY = 0;
            break;
        }
      };
    }
  };

  /**
   * 下拉刷新 上拉加载
   */
  class PullDownToFresh {
    /**
     *
     * @param {Object} option
     */
    constructor(option) {
      if (!typeof this instanceof PullDownToFresh) {
        return new PullDownToFresh(el);
      }
      if (typeof option !== "object") {
        throw new TypeError("PullDownFresh option need object");
      }

      let el = option.el;

      if (!el) {
        return;
      }

      if (typeof el === "string") {
        el = document.querySelector(el);
      } else if (el.nodeType !== 1 || el.$isInited) {
        return;
      }

      this.el = el;
      this.listenerQueue = [];
      this.eventBus = new EventBus();
      //上拉加载是否正在加载数据
      this.isLoading = false;
      //下拉刷新是否正在刷新
      this.isFreshing = false;

      this.settings = Object.assign(
        {},
        {
          //下拉触底触发距离
          distinstace: 100,
          //初始化完成
          initCb: utils.noop,
          //下拉刷新回调
          refreshCb: utils.noop,
          //上拉数据加载
          pullDownCb: utils.noop
        },
        option
      );
      //bind this
      this.destroy = this.destroy.bind(this);
      this.scrollHandler = this.scrollHandler.bind(this);
      this.touchHandler = this.touchHandler.bind(this);

      //indicator;

      this.pullIndicator = utils.createElement("div", {
        style: {
          height: "0px"
        },
        className: ["indicator"]
      });
      this.pushIndicator = utils.createElement("div", {
        style: {
          height: "0px"
        },
        className: ["indicator"]
      });
      this.init();
    }
    init() {
      this.bindEvent();
      this.eventBus.on("pullFresh", this.pullFresh.bind(this));
      this.eventBus.on("cancelFresh", this.cancelFresh.bind(this));
      this.eventBus.on("sureFresh", this.sureFresh.bind(this));
      this.eventBus.on("pushLoad", this.pushLoad.bind(this));
      this.eventBus.on("sureLoad", this.sureLoad.bind(this));
      this.eventBus.on("cancelLoad", this.cancelLoad.bind(this));

      utils.genHandler(this.eventBus, {
        distinstace: this.settings.distinstace
      });
    }
    pullFresh(data) {
      if (!this.el.contains(this.pullIndicator)) {
        this.el.insertBefore(this.pullIndicator, this.el.firstChild);
      }
      this.pullIndicator.style.height = data.diffY + "px";
    }
    cancelFresh() {
      const pullIndicator = this.pullIndicator;
      utils.addEventOne(pullIndicator, "transitionend", function() {
        const parentNode = pullIndicator.parentNode;
        parentNode && parentNode.removeChild(pullIndicator);
      });
      pullIndicator.style.height = 0 + "px";
    }
    sureFresh() {
      this.settings.sureFresh(this.cancelFresh.bind(this));
    }
    //开始上拉动画
    pushLoad(data) {

      if (!this.el.contains(this.pushIndicator)) {
        this.el.appendChild(this.pushIndicator);
      }

      this.pushIndicator.style.height = data.diffY + "px";
    }
    //取消上拉加载
    cancelLoad() {
      const pushIndicator = this.pushIndicator;
      utils.addEventOne(pushIndicator, "transitionend", function() {
        const parentNode = pushIndicator.parentNode;
        parentNode && parentNode.removeChild(pushIndicator);
      });

      pushIndicator.style.height = 0 + "px";
    }
    //确认加载
    sureLoad(data) {
      if (this.isLoading) {
        return;
      }
      this.isLoading = true;
      const cb = this.cancelLoad.bind(this);
      this.settings.sureLoad(
        function() {
          cb();
          this.isLoading = false;
        }.bind(this)
      );
    }
    bindEvent() {
      window.addEventListener("unload", this.destroy);
      const handler = utils.genHandler(this.eventBus, this.settings);
      this.listenerQueue.push(
        ...["touchstart", "touchmove", "touchend"].map(function(type) {
          return utils.addEvent(this.el, type, handler);
        }, this)
      );
      //this.listenerQueue.push(utils.addEvent(el, "scroll", this.scrollHandler));
    }
    destroy() {
      this.listenerQueue.forEach(lister => lister());
      this.el = null;
    }
    scrollHandler() {}
    touchHandler() {}
  }
  window.PullDownToFresh = PullDownToFresh;
})();
