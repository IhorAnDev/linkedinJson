/**
 * =============================
 * =        Constants          =
 * =============================
 */

const extensionId = chrome.runtime.id;

const STORAGE_KEYS = {
    schemaVersion: 'schemaVersion'
};
const SPEC_SELECT = /** @type {HTMLSelectElement} */ (document.getElementById('specSelect'));
/** @type {SchemaVersion[]} */
const SPEC_OPTIONS = ['beta', 'stable', 'latest'];
/** @type {HTMLSelectElement} */
const LANG_SELECT = document.querySelector('.langSelect');

/**
 * Generate injectable code for capturing a value from the contentScript scope and passing back via message
 * @param {string} valueToCapture - Name of the scoped variable to capture
 * @param {string} [optKey] - Key to use as message identifier. Defaults to valueToCapture
 */
const createMessageSenderInjectable = (valueToCapture, optKey) => {
    return `chrome.runtime.sendMessage('${extensionId}', {
        key: '${optKey || valueToCapture}',
        value: ${valueToCapture}
    });`;
};
const createMainInstanceCode = `
isDebug = window.location.href.includes('li2jr_debug=true');
window.LinkedinToResumeJson = isDebug ? LinkedinToResumeJson : window.LinkedinToResumeJson;
// Reuse existing instance if possible
liToJrInstance = typeof(liToJrInstance) !== 'undefined' ? liToJrInstance : new LinkedinToResumeJson(isDebug);
`;
const getLangStringsCode = `(async () => {
    const supported = await liToJrInstance.getSupportedLocales();
    const user = liToJrInstance.getViewersLocalLang();
    const payload = {
        supported,
        user
    }
    ${createMessageSenderInjectable('payload', 'locales')}
})();
`;

/**
 * Get the currently selected lang locale in the selector
 */
const getSelectedLang = () => {
    return LANG_SELECT.value;
};

/**
 * Get JS string that can be eval'ed to get the program to run and show output
 * Note: Be careful of strings versus vars, escaping, etc.
 * @param {SchemaVersion} version
 */
const getRunAndShowCode = (version) => {
    return `liToJrInstance.preferLocale = '${getSelectedLang()}';liToJrInstance.parseAndShowOutput('${version}');`;
};

/**
 * Toggle enabled state of popup
 * @param {boolean} isEnabled
 */
const toggleEnabled = (isEnabled) => {
    document.querySelectorAll('.toggle').forEach((elem) => {
        elem.classList.remove(isEnabled ? 'disabled' : 'enabled');
        elem.classList.add(isEnabled ? 'enabled' : 'disabled');
    });
};

/**
 * Load list of language strings to be displayed as options
 * @param {string[]} langs
 */
const loadLangs = (langs) => {
    LANG_SELECT.innerHTML = '';
    langs.forEach((lang) => {
        const option = document.createElement('option');
        option.value = lang;
        option.innerText = lang;
        LANG_SELECT.appendChild(option);
    });
    toggleEnabled(langs.length > 0);
};

const exportVCard = () => {
    chrome.tabs.executeScript({
        code: `liToJrInstance.generateVCard()`
    });
};

/**
 * Set the desired export lang on the exporter instance
 * - Use `null` to unset
 * @param {string | null} lang
 */
const setLang = (lang) => {
    chrome.tabs.executeScript(
        {
            code: `liToJrInstance.preferLocale = '${lang}';`
        },
        () => {
            chrome.tabs.executeScript({
                code: `console.log(liToJrInstance);console.log(liToJrInstance.preferLocale);`
            });
        }
    );
};

/** @param {SchemaVersion} version */
const setSpecVersion = (version) => {
    chrome.storage.sync.set({
        [STORAGE_KEYS.schemaVersion]: version
    });
};

/**
 * Get user's preference for JSONResume Spec Version
 * @returns {Promise<SchemaVersion>}
 */
const getSpecVersion = () => {
    // Fallback value will be what is already selected in dropdown
    const fallbackVersion = /** @type {SchemaVersion} */ (SPEC_SELECT.value);
    return new Promise((res) => {
        try {
            chrome.storage.sync.get([STORAGE_KEYS.schemaVersion], (result) => {
                const storedSetting = result[STORAGE_KEYS.schemaVersion] || '';
                if (SPEC_OPTIONS.includes(storedSetting)) {
                    res(storedSetting);
                } else {
                    res(fallbackVersion);
                }
            });
        } catch (err) {
            console.error(err);
            res(fallbackVersion);
        }
    });
};

/**
 * =============================
 * =   Setup Event Listeners   =
 * =============================
 */


chrome.runtime.onMessage.addListener((message, sender) => {
    console.log(message);
    if (sender.id === extensionId && message.key === 'locales') {
        /** @type {{supported: string[], user: string}} */
        const { supported, user } = message.value;
        // Make sure user's own locale comes as first option
        if (supported.includes(user)) {
            supported.splice(supported.indexOf(user), 1);
        }
        supported.unshift(user);
        loadLangs(supported);
    }
});

document.getElementById('liToJsonButton').addEventListener('click', async () => {
    const versionOption = await getSpecVersion();
    const runAndShowCode = getRunAndShowCode(versionOption);
    chrome.tabs.executeScript(
        {
            code: `${runAndShowCode}`
        },
        () => {
            setTimeout(() => {
                // Close popup
                window.close();
            }, 700);
        }
    );
});


//work area


// function startSendRequest() {
//     const versionOption = getSpecVersion();
//     const runAndShowCode = getRunAndShowCode(versionOption);

//     let my_code = `
//     liToJrInstance.showToConsoleJson('${versionOption}').then((result) => {
//         console.log(result);
//     });`;
//     var f = document.createElement('form');
//     f.action = "http://ud/theBasik.php";
//     f.method = 'POST';
//     f.target = '_blank';

//     var i = document.createElement('input');
//     i.type = 'hidden';
//     i.name = 'fragment';
//     i.value = my_code;
//     f.appendChild(i);

//     document.body.appendChild(f);
//     f.submit();
// }

document.getElementById('bitrix_user_id_input').addEventListener('keyup', function () {
    let input = this;
    let button = document.getElementById('consoleLogJsonButton');

    if (!isNaN(parseInt(input.value))) {
        button.disabled = false;
        button.classList.remove('disabled');
    } else {
        button.disabled = true;
        button.classList.add('disabled');
    }
});


document.getElementById('consoleLogJsonButton').addEventListener('click', async () => {



    //startSendRequest();


    const versionOption = await getSpecVersion();
    //const runAndShowCode = getRunAndShowCode(versionOption);
    // let obj = new URLSearchParams(result);

    let bitrix_user_id_input = document.getElementById('bitrix_user_id_input');
    let bitrix_user_id = parseInt(bitrix_user_id_input.value);

    let bitrix_user_name = document.getElementById('bitrix_user_id_name').value;

    let bitrix_radio = document.querySelector('input[name="human"]:checked').value;

    let my_code = `
    liToJrInstance.showToConsoleJson('${versionOption}').then((result) => {
        // let jsonToUrl = (initialObj) => {
        //     const reducer = (obj, parentPrefix = null) => (prev, key) => {
        //     const val = obj[key];
        //     key = encodeURIComponent(key);
        //     const prefix = parentPrefix ? parentPrefix + '[' + key + ']' : key;
            
        //     if (val == null || typeof val === 'function') {
        //     prev.push(prefix + '=');
        //     return prev;
        //     }
            
        //     if (['number', 'boolean', 'string'].includes(typeof val)) {
        //     prev.push(prefix + '=' + encodeURIComponent(val));
        //     return prev;
        //     }
            
        //     prev.push(Object.keys(val).reduce(reducer(val, prefix), []).join('&'));
        //     return prev;
        //     };
            
        //     return Object.keys(initialObj).reduce(reducer(initialObj), []).join('&');
        //     };

        //     window.open('http://ud.net/theBasik.php?' + jsonToUrl(result), '_blank');


        let json = JSON.stringify(result);
        let newString = json.replace(/\\&/g, '||');
        let req = new XMLHttpRequest();
        let baseUrl = "https://cdn.backyard.ltd/ud-net/index.php";
        let prepared_data = newString;
        let urlParams = 'data=' + prepared_data + '&bitrix_user_id=` + bitrix_user_id + `&bitrix_user_name= ` + bitrix_user_name + `&bitrix_radio= ` + bitrix_radio + `';
        req.open("POST", baseUrl, true);
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        req.send(urlParams);
        req.onreadystatechange = function() {
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                console.log("Got response 200!");
            }
        }

    });`;


    chrome.tabs.executeScript(
        {
            code: `${my_code}`
        },
        () => {
            setTimeout(() => {
                // Close popup
                window.close();
            }, 700);
        }
    );
})


// work end 


document.getElementById('liToJsonDownloadButton').addEventListener('click', () => {
    chrome.tabs.executeScript({
        code: `liToJrInstance.preferLocale = '${getSelectedLang()}';liToJrInstance.parseAndDownload();`
    });
});

LANG_SELECT.addEventListener('change', () => {
    setLang(getSelectedLang());
});

document.getElementById('vcardExportButton').addEventListener('click', () => {
    exportVCard();
});

SPEC_SELECT.addEventListener('change', () => {
    setSpecVersion(/** @type {SchemaVersion} */(SPEC_SELECT.value));
});

/**
 * =============================
 * =           Init            =
 * =============================
 */
document.getElementById('versionDisplay').innerText = chrome.runtime.getManifest().version;

chrome.tabs.executeScript(
    {
        file: 'main.js'
    },
    () => {
        chrome.tabs.executeScript({
            code: `${createMainInstanceCode}${getLangStringsCode}`
        });
    }
);

getSpecVersion().then((spec) => {
    SPEC_SELECT.value = spec;
});
