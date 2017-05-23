/**
 * Created by Why on 2017/2/26.
 */
var Barrage = {
    // canvas id
    canvasId: null,
    // canvas元素
    canvas: null,
    // canvas上下文
    context: null,
    // 弹幕定时器
    timer: null,
    // 弹幕对象数组
    texts: [],
    // 页面暂停时间
    pauseTime: 0,
    // 计数器暂停次数，默认1（无暂停）
    pauseCount: 1,
    //  默认样式
    style: {
        // 弹幕容器的宽高，背景颜色
        width: 1200,
        height: 720,
        bgcolor: "#000",
        // 全局字体样式
        font: {
            size: 30,
            color: "#fff",
            family: "黑体"
        },
        // 框的颜色
        strokeColor: "#fff",
        // 弹幕显示时长
        duration: 5000,
        // 弹幕移动间隔
        interval: 10
    },
    // 弹幕 Y 坐标数组
    arrY: null,
    // 弹幕 Y 坐标数组下标
    idx: 0,
    // 弹幕canvas初始化
    init: function (option) {
        if (isNull(option) || isNull(option.canvasId)) {
            console.error("canvasId must be defined");
            return;
        } else {
            this.canvasId = option.canvasId;
        }

        this.canvas = document.getElementById(this.canvasId);
        if (isNull(this.canvas)) {
            console.error("canvas can not be found by id: " + this.canvasId);
            return;
        }

        this.initCanvas(option);

        this.initFontStyle(option);

        this.initContext();

        if (isNotNull(option.duration)) {
            this.style.duration = option.duration;
        }
        if (isNotNull(option.interval)) {
            this.style.interval = option.interval;
        }

        this.initArrY();

        this.start();

        this.initPauseHandler();

        return this;
    },
    // 初始化弹幕 canvas 样式
    initCanvas: function (option) {
        if (isNotNull(option.width)) {
            this.style.width = option.width;
        }
        if (isNotNull(option.height)) {
            this.style.height = option.height;
        }
        if (isNull(option.bgcolor)) {
            option.bgcolor = this.style.bgcolor;
        }
        this.canvas.width = this.style.width;
        this.canvas.height = this.style.height;
        this.canvas.style.backgroundColor = option.bgcolor;
    },
    // 初始化 canvas 上下文
    initContext: function () {
        this.context = this.canvas.getContext("2d");
        this.context.font = this.style.font.size + "px " + this.style.font.family;
    },
    // 初始化弹幕文字样式
    initFontStyle: function (option) {
        if (isNotNull(option.font)) {
            if (isNotNull(option.font.size)) {
                this.style.font.size = option.font.size;
            }
            if (isNotNull(option.font.color)) {
                this.style.font.color = option.font.color;
            }
            if (isNotNull(option.font.family)) {
                this.style.font.family = option.font.family;
            }
        }

        if (isNotNull(option.strokeColor)) {
            this.style.strokeColor = option.color;
        }
    },
    // 初始化弹幕 Y 坐标数组
    initArrY: function () {
        // 弹幕行高间距
        var lineHeight = this.style.font.size / 5;
        // 弹幕的总高度
        var totalHeight = this.style.height - 2;
        // 单行弹幕高度
        var height = this.style.font.size;
        // 弹幕总高度所承载的弹幕行数
        var maxLine = parseInt(totalHeight / (this.style.font.size + lineHeight));

        // this.arrY = new Array(maxLine);
        this.arrY = new Array();
        this.arrY[0] = height + 5;
        var y = height + lineHeight;
        for (var i = 1; i < maxLine; i++) {
            this.arrY[i] = this.arrY[i - 1] + y;
        }
    },
    // 初始化页面可见性监听事件
    initPauseHandler : function () {
        var that = this;
        document.addEventListener("visibilitychange", function () {
            var state = document.visibilityState;
            if (state == "hidden") {
                that.pauseTime = new Date().getTime();
            } else if (state == "visible") {
                var currentTime = new Date().getTime();
                // 计算暂停了多少次计时器
                that.pasueCount = parseInt((currentTime - that.pauseTime) / that.style.interval);
            }
        });
    },
    // 初始化画弹幕定时器
    start: function () {
        var that = this;
        this.timer = setInterval(function () {
            if (isNull(that.texts) || that.texts.length == 0) {
                return;
            }

            that.refresh();

            for (var idx in that.texts) {
                if (isNull(that.texts[idx]) || isNull(that.texts[idx].text)) {
                    continue;
                }

                if (!that.texts[idx].isDraw) {
                    that.texts[idx].isDraw = true;

                    // 如果弹幕文字颜色为空，则默认为全局弹幕颜色
                    if (isNull(that.texts[idx].color)) {
                        that.texts[idx].color = that.style.font.color;
                    }

                    // 如果弹幕边框颜色为空，则默认与全局弹幕边框颜色相同
                    if (isNull(that.texts[idx].strokeColor)) {
                        that.texts[idx].strokeColor = that.style.strokeColor;
                    }

                    // 初始化弹幕坐标
                    that.texts[idx].x = that.style.width;
                    that.texts[idx].y = that.arrY[that.idx++];
                    that.texts[idx].strokeWidth = that.getStorkeWidth(that.texts[idx].text);

                    if (that.idx == that.arrY.length) {
                        that.idx = 0;
                    }

                    if (isNull(that.texts[idx].duration)) {
                        if (that.texts[idx].text.length == 1) {
                            that.texts[idx].duration = that.style.duration;
                        } else {
                            that.texts[idx].duration = that.style.duration - (50 * that.texts[idx].text.length);
                            if (that.texts[idx].duration < 2000) {
                                that.texts[idx].duration = 2000;
                            }
                        }
                    }

                    that.texts[idx].speed = that.style.width / that.texts[idx].duration * that.style.interval;
                } else {
                    that.texts[idx].x -= (that.texts[idx].speed * that.pasueCount);

                    if (that.texts[idx].x < -(that.texts[idx].strokeWidth)) {
                        that.texts[idx] = null;
                    } else {
                        that.context.fillStyle = that.texts[idx].color;
                        that.context.fillText(that.texts[idx].text, that.texts[idx].x, that.texts[idx].y);

                        if (that.texts[idx].isFromMe) {
                            that.drawStrokeRect(that.texts[idx]);
                        }
                        that.context.restore();
                    }
                }
            }
            that.pasueCount = 1;
        }, this.style.interval);
    },
    // 弹幕画框
    drawStrokeRect: function (data) {
        this.context.strokeStyle = data.strokeColor;
        var strokeX = data.x - (this.style.font.size / 2);
        var strokeY = data.y - this.style.font.size;
        var strokeWidth = data.strokeWidth;
        var strokeHeight = this.style.font.size + parseInt(this.style.font.size / 3);
        this.context.strokeRect(strokeX, strokeY, strokeWidth, strokeHeight);
    },
    // 计算弹幕画框的宽度
    getStorkeWidth: function (text) {
        var count = 0;
        for (var i in text) {
            if (/[0-9a-zA-Z]/.test(text[i])) {
                count++;
            }
        }
        var right;
        if (count % 2 == 0) {
            right = this.style.font.size;
        } else {
            right = parseInt(this.style.font.size / 2);
        }
        return (text.length - parseInt(count / 2)) * this.style.font.size + right;
    },
    // 发送弹幕
    send: function (data) {
        if (isNull(data)) {
            return;
        }
        this.texts.push(data);
    },
    // 清空弹幕
    refresh: function () {
        this.context.clearRect(0, 0, this.style.width, this.style.height);
        this.context.save();
    },
    // 关闭弹幕
    clear: function () {
        this.refresh();
        clearInterval(this.timer);
        this.timer = null;
    }
}

function isNotNull(obj) {
    if (!obj || obj == null || obj == "undefinded") {
        return false;
    }
    return true;
}

function isNull(obj) {
    return !isNotNull(obj);
}