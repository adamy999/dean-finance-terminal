// ========================================
// DEAN FINANCE TERMINAL
// JavaScript V3.0
// 台股自選股表格
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
// 儲存到瀏覽器
// ========================================

function saveStocks() {

    localStorage.setItem(
        "deanTaiwanStocks",
        JSON.stringify(stocks)
    );

}


// ========================================
// 讀取瀏覽器資料
// ========================================

function loadLocalStocks() {

    const saved = localStorage.getItem(
        "deanTaiwanStocks"
    );

    if (saved) {

        try {

            stocks = JSON.parse(saved);

            return true;

        } catch (error) {

            console.error("localStorage 資料錯誤");

        }

    }

    return false;

}


// ========================================
// 建立表格
// ========================================

function renderStocks() {

    const container =
        document.getElementById("taiwan-stocks");

    if (!container) return;

    container.innerHTML = "";


    // ------------------------------------
    // 表格標題
    // ------------------------------------

    const title = document.createElement("h3");

    title.textContent = "我的自選股";

    container.appendChild(title);


    // ------------------------------------
    // 表格
    // ------------------------------------

    const table = document.createElement("table");

    table.className = "stock-table";


    // ------------------------------------
    // 表頭
    // ------------------------------------

    const thead = document.createElement("thead");

    const headerRow = document.createElement("tr");


    const headers = [
        "代號",
        "名稱",
        "現價",
        "漲跌",
        "漲幅",
        "操作"
    ];


    headers.forEach(function(header) {

        const th = document.createElement("th");

        th.textContent = header;

        headerRow.appendChild(th);

    });


    thead.appendChild(headerRow);

    table.appendChild(thead);


    // ------------------------------------
    // 表格內容
    // ------------------------------------

    const tbody = document.createElement("tbody");


    stocks.forEach(function(stock, index) {

        const row = document.createElement("tr");


        // 股票代號
        const codeCell = document.createElement("td");

        codeCell.textContent = stock.code;

        row.appendChild(codeCell);


        // 股票名稱
        const nameCell = document.createElement("td");

        nameCell.textContent = stock.name;

        row.appendChild(nameCell);


        // 現價
        const priceCell = document.createElement("td");

        priceCell.textContent = "—";

        priceCell.className = "no-data";

        row.appendChild(priceCell);


        // 漲跌
        const changeCell = document.createElement("td");

        changeCell.textContent = "—";

        changeCell.className = "no-data";

        row.appendChild(changeCell);


        // 漲幅
        const percentCell = document.createElement("td");

        percentCell.textContent = "—";

        percentCell.className = "no-data";

        row.appendChild(percentCell);


        // 操作
        const actionCell = document.createElement("td");


        const deleteButton =
            document.createElement("button");

        deleteButton.textContent = "刪除";

        deleteButton.className = "delete-button";


        deleteButton.addEventListener(
            "click",
            function() {

                stocks.splice(index, 1);

                saveStocks();

                renderStocks();

            }
        );


        actionCell.appendChild(deleteButton);

        row.appendChild(actionCell);


        tbody.appendChild(row);

    });


    table.appendChild(tbody);

    container.appendChild(table);


    // ====================================
    // 新增股票區
    // ====================================

    const form = document.createElement("div");

    form.className = "stock-form";


    // 股票代號
    const codeInput =
        document.createElement("input");

    codeInput.placeholder = "股票代號";

    codeInput.className = "stock-input";


    // 股票名稱
    const nameInput =
        document.createElement("input");

    nameInput.placeholder = "股票名稱";

    nameInput.className = "stock-input";


    // 新增按鈕
    const addButton =
        document.createElement("button");

    addButton.textContent = "＋ 新增";

    addButton.className = "add-button";


    addButton.addEventListener(
        "click",
        function() {

            const code =
                codeInput.value.trim();

            const name =
                nameInput.value.trim();


            // 沒有代號
            if (code === "") {

                alert("請輸入股票代號");

                return;

            }


            // 防止重複
            const alreadyExists =
                stocks.some(function(stock) {

                    return stock.code === code;

                });


            if (alreadyExists) {

                alert("這檔股票已經在自選股中");

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

        const hasLocalData =
            loadLocalStocks();


        if (hasLocalData) {

            renderStocks();

        } else {

            await loadStocks();

        }

    }
);
