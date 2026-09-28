// ========================================
// DEAN FINANCE TERMINAL
// JavaScript V2.0
// 台股自選股：JSON + 新增 / 刪除
// ========================================


// ========================================
// 初始資料
// ========================================

let stocks = [];


// ========================================
// 從 JSON 載入自選股
// ========================================

async function loadStocks() {

    try {

        const response = await fetch("data/watchlist.json");

        if (!response.ok) {
            throw new Error("無法讀取 watchlist.json");
        }

        const data = await response.json();

        stocks = data.taiwan || [];

        renderStocks();

    } catch (error) {

        console.error(error);

        alert("自選股資料載入失敗");

    }
}


// ========================================
// 儲存資料到瀏覽器
// ========================================

function saveStocks() {

    localStorage.setItem(
        "deanTaiwanStocks",
        JSON.stringify(stocks)
    );
}


// ========================================
// 從瀏覽器記憶中讀取
// ========================================

function loadLocalStocks() {

    const saved = localStorage.getItem(
        "deanTaiwanStocks"
    );

    if (saved) {

        stocks = JSON.parse(saved);

        return true;

    }

    return false;
}


// ========================================
// 顯示台股自選股
// ========================================

function renderStocks() {

    const container = document.getElementById(
        "taiwan-stocks"
    );

    if (!container) return;

    container.innerHTML = "";


    // 標題
    const title = document.createElement("h3");

    title.textContent = "我的自選股";

    container.appendChild(title);


    // 股票列表
    stocks.forEach(function(stock, index) {

        const row = document.createElement("div");

        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.alignItems = "center";
        row.style.padding = "10px";
        row.style.marginBottom = "8px";
        row.style.background = "#11151d";
        row.style.borderRadius = "6px";


        const text = document.createElement("span");

        text.textContent =
            stock.code + "  " + stock.name;


        const deleteButton =
            document.createElement("button");

        deleteButton.textContent = "刪除";


        deleteButton.addEventListener(
            "click",
            function() {

                stocks.splice(index, 1);

                saveStocks();

                renderStocks();

            }
        );


        row.appendChild(text);

        row.appendChild(deleteButton);

        container.appendChild(row);

    });


    // ====================================
    // 新增股票
    // ====================================

    const form = document.createElement("div");

    form.style.marginTop = "15px";


    const codeInput =
        document.createElement("input");

    codeInput.placeholder = "股票代號";


    const nameInput =
        document.createElement("input");

    nameInput.placeholder = "股票名稱";


    const addButton =
        document.createElement("button");

    addButton.textContent = "＋ 新增";


    addButton.addEventListener(
        "click",
        function() {

            const code =
                codeInput.value.trim();

            const name =
                nameInput.value.trim();


            if (code === "") {

                alert("請輸入股票代號");

                return;

            }


            stocks.push({

                code: code,

                name: name || "未命名"

            });


            saveStocks();

            renderStocks();


            codeInput.value = "";

            nameInput.value = "";

        }
    );


    form.appendChild(codeInput);

    form.appendChild(nameInput);

    form.appendChild(addButton);


    container.appendChild(form);

}


// ========================================
// 網頁載入
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        // 如果瀏覽器已經有自己的自選股
        // 就優先使用瀏覽器資料
        const hasLocalData = loadLocalStocks();


        if (hasLocalData) {

            renderStocks();

        } else {

            await loadStocks();

        }

    }
);
