/** モジュールを読み込む */
export async function loadModules(modules) {
    return new Promise((resolve) => {
        require(modules, function () {
            let response = [];
            for (let i = 0; i < arguments.length; i++)
            {
                response.push(arguments[i]);
            }
            resolve(response);
        });
    });
}

/** エラーメッセージを表示する */
export function showAlert(message) {
    let alert = document.getElementById("errorMessage");
    alert.querySelector("div[slot='message']").innerHTML = message;
    alert.open = true;
}


/** Confirm用アラート */
function createConfirmElem(title, message) {
    return `<calcite-alert label="confirm" kind="brand" open="true">
                <div slot="title">${title}</div>
                <div slot="message">
                    <div class="row">
                        <div class="col-12 mt-2 mb-2">
                            ${message}
                        </div>
                        <div class="col-6">
                            <input type="submit" id="confirmSubmitButton" value="はい" class="esri-button">
                        </div>
                        <div class="col-6">
                            <input type="button" value="いいえ" class="esri-button esri-button--secondary">
                        </div>
                    </div>
                </div>
            </calcite-alert>`;
}

/**
 * 確認ダイアログ
 * @param {string} title 確認ダイアログのタイトル
 * @param {string} message 確認ダイアログのメッセージ
 * @param {Function} func OKクリック時の処理
 * @param {Object} params OKクリック時の処理パラメータ
 */
export function customConfirm(title, message, func, paramas = null) {
    let customConfirm = document.getElementById("customConfirm");
    customConfirm.innerHTML = "";

    let confirm = createConfirmElem(title, message, func);
    customConfirm.innerHTML = confirm;
    customConfirm.querySelector("input[type='submit']").addEventListener("click", function () {
        try {
            if (paramas) {
                func(paramas);
            } else {
                func();
            }
        }finally {
            customConfirm.innerHTML = "";
        }
    });
    customConfirm.querySelector("input[type='button']").addEventListener("click", function () {
        customConfirm.innerHTML = "";
    });
}

/** ローディング画面を表示する */
export function showLoading() {    
    const lodingElem = document.getElementById("loading");
    lodingElem.classList.remove("d-none");
}

/** ローディング画面を非表示にする */
export function hideLoading() {
    const lodingElem = document.getElementById("loading");
    lodingElem.classList.add("d-none");
}

export function convertNullToEmpty(value) {
    if (value === undefined || value === null) {
        return "";
    }
    else
    {
        return value;
    }
}

export function convertNumberToFixed(value,digits) {
    if (value === undefined || value === null) {
        return "";
    }
    else {
        return value.toFixed(digits);
    }
}

/** 表示・非表示を切り替える */
export function toggleElem(elem) {
    if (elem.classList.contains('d-none')) {
        elem.classList.remove("d-none");
    } else {
        elem.classList.add("d-none");
    }
}