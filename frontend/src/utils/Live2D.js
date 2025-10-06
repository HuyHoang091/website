export const handleReload = (styles) => {
    const shutter = document.getElementById("shutter");
    if (!shutter) return;
    shutter.classList.add(styles.shutterDown);

    setTimeout(() => {
        window.L2Dwidget.init({
            model: {
                jsonPath: "https://unpkg.com/live2d-widget-model-hijiki@1.0.5/assets/hijiki.model.json",
            },
            display: {
                superSample: 2,
                width: 83,
                height: 83,
                position: "left",
                hOffset: 0,
                vOffset: 0
            },
            mobile: {
                show: true,
                scale: 0.2,
            },
            react: {
                opacityDefault: 0,
                opacityOnHover: 1,
            }
        });

        setTimeout(() => {
            shutter.classList.remove(styles.shutterDown);
        }, 1500);
    }, 1500);
};

export const setupLive2D = (styles) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/live2d-widget@3.0.4/lib/L2Dwidget.min.js";
    script.async = true;

    script.onload = () => {
        if (window.L2Dwidget) {
            const oldCanvas = document.getElementById("live2dcanvas");
            if (oldCanvas) oldCanvas.remove();

            Audio.prototype.play = function () {
                return Promise.resolve();
            };

            window.L2Dwidget.init({
                model: {
                    jsonPath: "https://unpkg.com/live2d-widget-model-Shizuku@1.0.5/assets/Shizuku.model.json",
                },
                display: {
                    superSample: 2,
                    width: 70,
                    height: 70,
                    position: "left",
                    hOffset: 0,
                    vOffset: 0
                },
                mobile: {
                    show: true,
                    scale: 0.2,
                },
                react: {
                    opacityDefault: 0,
                    opacityOnHover: 1,
                }
            });

            setTimeout(() => {
                const canvas = document.getElementById("live2dcanvas");
                const wrapper = document.querySelector(`.${styles.live2dWrapper}`);
                if (canvas && wrapper) {
                    wrapper.appendChild(canvas);
                    canvas.style.position = "relative";
                    canvas.style.left = "0px";
                    canvas.style.bottom = "0px";
                    canvas.style.zIndex = "0";
                    canvas.style.opacity = "1";
                    canvas.style.paddingTop = "25px";
                    canvas.style.paddingLeft = "5px";
                    canvas.style.borderStyle = "none";
                }
            }, 1000);
        }
    };

    document.body.appendChild(script);
};