// ========================================
// DEAN FINANCE TERMINAL
// JavaScript V1.0
// 台股自選股：新增 / 刪除
// ========================================

// 預設自選股
const defaultStocks = [
    {
        code: "2330",
        name: "台積電"
    },
    {
        code: "3037",
        name: "欣興"
    },
    {
        code: "2303",
        name: "聯電"
    }
];


// 從瀏覽器記憶中讀取自選股
let stocks = JSON.parse(
    localStorage.getItem("deanTaiwanStocks")
) || defaultStocks;


// ========================================
// 儲存資料
// ========================================
function saveStocks() {

    localStorage.setItem(
        "deanTaiwanStocks",
        JSON.stringify(stocks)
    );
}


// ========================================
// 顯示台股自選股
// ========================================
function renderStocks() {

    const container = document.getElementById("taiwan-stocks");

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


        const deleteButton = document.createElement("button");

        deleteButton.textContent = "刪除";


        deleteButton.addEventListener("click", function() {

            stocks.splice(index, 1);

            saveStocks();

            renderStocks();

        });


        row.appendChild(text);
        row.appendChild(deleteButton);

        container.appendChild(row);

    });


    // ================================
    // 新增股票區
    // ================================

    const form = document.createElement("div");

    form.style.marginTop = "15px";


    const codeInput = document.createElement("input");

    codeInput.placeholder = "股票代號";


    const nameInput = document.createElement("input");

    nameInput.placeholder = "股票名稱";


    const addButton = document.createElement("button");

    addButton.textContent = "＋ 新增";


    addButton.addEventListener("click", function() {

        const code = codeInput.value.trim();
        const name = nameInput.value.trim();


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


    });


    form.appendChild(codeInput);

    form.appendChild(nameInput);

    form.appendChild(addButton);


    container.appendChild(form);

}


// ========================================
// 網頁載入完成後執行
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        renderStocks();

    }
);
