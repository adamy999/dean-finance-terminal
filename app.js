// ========================================
// DEAN FINANCE TERMINAL
// JavaScript V4.0
// 台股自選股 + FinMind 每日收盤資料
// ========================================

const FINMIND_API =
    "https://api.finmindtrade.com/api/v4/data";

let stocks = [];
let priceData = {};
let priceErrors = {};
let priceStatus = "準備載入股價資料";
let loadingPrices = false;


// ========================================
// 日期工具：使用台灣電腦的本地日期
// ========================================

function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function getDateRange() {
    const end = new Date();
    const start = new Date();

    // 回查 30 天，涵蓋週末與休市日
    start.setDate(start.getDate() - 30);

    return {
        startDate: formatLocalDate(start),
        endDate: formatLocalDate(end)
    };
}


// ========================================
// 從 JSON 載入預設自選股
// ========================================

async function loadStocks() {
    try {
        const response = await fetch("data/watchlist.json");

        if (!response.ok) {
            throw new Error("無法讀取 watchlist.json");
        }

        const data = await response.json();
        stocks = Array.isArray(data.taiwan) ? data.taiwan : [];

    } catch (error) {
        console.error("自選股 JSON 載入失敗：", error);
        priceStatus = "自選股資料載入失敗，請檢查 watchlist.json";
    }
}


// ========================================
// 儲存自選股到瀏覽器
// ========================================

function saveStocks() {
    localStorage.setItem(
        "deanTaiwanStocks",
        JSON.stringify(stocks)
    );
}


// ========================================
// 讀取瀏覽器內已保存的自選股
// ========================================

function loadLocalStocks() {
    const saved = localStorage.getItem("deanTaiwanStocks");

    if (!saved) {
        return false;
    }

    try {
        const data = JSON.parse(saved);

        if (!Array.isArray(data)) {
            return false;
        }

        stocks = data;
        return true;

    } catch (error) {
        console.error("瀏覽器自選股資料格式錯誤：", error);
        return false;
    }
}


// ========================================
// 從 FinMind 取得單一股票每日價格
// ========================================

async function fetchStockPrice(code) {
    const { startDate, endDate } = getDateRange();

    const params = new URLSearchParams({
        dataset: "TaiwanStockPrice",
        data_id: String(code),
        start_date: startDate,
        end_date: endDate
    });

    const url = `${FINMIND_API}?${params.toString()}`;

    const response = await fetch(url, {
        cache: "no-store"
    });

    if (!response.ok) {
        throw new Error(`API HTTP 錯誤：${response.status}`);
    }

    const result = await response.json();

    if (!Array.isArray(result.data)) {
        throw new Error(result.msg || "API 沒有回傳股價資料");
    }

    // 排除無收盤價的資料，再依日期排序
    const records = result.data
        .filter(function(item) {
            return item.date &&
                item.close !== null &&
                item.close !== undefined &&
                Number.isFinite(Number(item.close));
        })
        .sort(function(a, b) {
            return a.date.localeCompare(b.date);
        });

    if (records.length === 0) {
        throw new Error("查無此股票的每日價格");
    }

    // 最新一筆可取得的每日資料
    const latest = records[records.length - 1];
    const close = Number(latest.close);

    // spread 是每日漲跌價差
    let change;

    if (
        latest.spread !== null &&
        latest.spread !== undefined &&
        latest.spread !== ""
    ) {
        change = Number(latest.spread);

    } else if (records.length >= 2) {
        const previous = Number(records[records.length - 2].close);
        change = close - previous;

    } else {
        change = null;
    }

    // 以收盤價和漲跌價差反推前一日參考價
    let percent = null;

    if (change !== null && Number.isFinite(change)) {
        const previousReference = close - change;

        if (previousReference > 0) {
            percent = change / previousReference * 100;
        }
    }

    return {
        close: close,
        change: change,
        percent: percent,
        date: latest.date
    };
}


// ========================================
// 讀取一檔股票的價格
// ========================================

async function loadOneStock(stock) {
    const code = String(stock.code);

    try {
        const data = await fetchStockPrice(code);

        priceData[code] = data;
        delete priceErrors[code];

    } catch (error) {
        priceData[code] = null;
        priceErrors[code] = error.message || "未知錯誤";

        console.error(`股票 ${code} 讀取失敗：`, error);
    }
}


// ========================================
// 更新所有自選股價格
// ========================================

async function refreshPrices() {
    if (stocks.length === 0) {
        priceStatus = "目前沒有自選股，請先新增股票";
        renderStocks();
        return;
    }

    loadingPrices = true;
    priceStatus = "正在取得每日收盤資料……";

    renderStocks();

    // 同時取得自選股價格
    await Promise.all(
        stocks.map(function(stock) {
            return loadOneStock(stock);
        })
    );

    loadingPrices = false;

    const successfulStocks = stocks.filter(function(stock) {
        return Boolean(priceData[String(stock.code)]);
    });

    const failedCount = stocks.length - successfulStocks.length;

    const dates = successfulStocks
        .map(function(stock) {
            return priceData[String(stock.code)].date;
        })
        .sort();

    const latestDate = dates.length
        ? dates[dates.length - 1]
        : null;

    if (failedCount === 0) {
        priceStatus =
            `資料來源：FinMind｜每日收盤（非即時）｜最近資料日：${latestDate}`;

    } else if (successfulStocks.length === 0) {
        priceStatus =
            `股價讀取失敗：${failedCount} 檔。請檢查網路、API 回應或瀏覽器跨網域限制。`;

    } else {
        priceStatus =
            `FinMind 每日收盤資料（非即時）｜${failedCount} 檔讀取失敗｜最近資料日：${latestDate || "—"}`;
    }

    renderStocks();
}


// ========================================
// 數字格式
// ========================================

function formatPrice(value) {
    if (value === null || !Number.isFinite(value)) {
        return "—";
    }

    return value.toLocaleString("zh-TW", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function formatChange(value) {
    if (value === null || !Number.isFinite(value)) {
        return "—";
    }

    const sign = value > 0 ? "+" : "";

    return sign + value.toFixed(2);
}


function formatPercent(value) {
    if (value === null || !Number.isFinite(value)) {
        return "—";
    }

    const sign = value > 0 ? "+" : "";

    return sign + value.toFixed(2) + "%";
}


// ========================================
// 建立自選股表格
// ========================================

function renderStocks() {
    const container = document.getElementById("taiwan-stocks");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const title = document.createElement("h3");
    title.textContent = "我的自選股";
    container.appendChild(title);

    // 資料狀態說明
    const status = document.createElement("div");
    status.className = "stock-status";
    status.textContent = priceStatus;

    status.style.margin = "8px 0 14px";
    status.style.fontSize = "12px";
    status.style.color = "#8b93a1";

    container.appendChild(status);

    // 表格
    const table = document.createElement("table");
    table.className = "stock-table";

    const headers = [
        "代號",
        "名稱",
        "最新收盤",
        "漲跌",
        "漲幅",
        "資料日期",
        "操作"
    ];

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    headers.forEach(function(header) {
        const th = document.createElement("th");
        th.textContent = header;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    stocks.forEach(function(stock) {
        const code = String(stock.code);
        const quote = priceData[code];
        const row = document.createElement("tr");

        // 股票代號
        const codeCell = document.createElement("td");
        codeCell.textContent = code;
        row.appendChild(codeCell);

        // 股票名稱
        const nameCell = document.createElement("td");
        nameCell.textContent = stock.name || "未命名";
        row.appendChild(nameCell);

        // 最新收盤價
        const priceCell = document.createElement("td");

        if (quote) {
            priceCell.textContent = formatPrice(quote.close);
        } else if (loadingPrices) {
            priceCell.textContent = "讀取中…";
        } else if (priceErrors[code]) {
            priceCell.textContent = "取得失敗";
            priceCell.title = priceErrors[code];
        } else {
            priceCell.textContent = "—";
        }

        row.appendChild(priceCell);

        // 漲跌
        const changeCell = document.createElement("td");

        changeCell.textContent = quote
            ? formatChange(quote.change)
            : "—";

        if (quote && quote.change > 0) {
            changeCell.style.color = "#ff6b6b";
        } else if (quote && quote.change < 0) {
            changeCell.style.color = "#4ade80";
        }

        row.appendChild(changeCell);

        // 漲幅
        const percentCell = document.createElement("td");

        percentCell.textContent = quote
            ? formatPercent(quote.percent)
            : "—";

        if (quote && quote.percent > 0) {
            percentCell.style.color = "#ff6b6b";
        } else if (quote && quote.percent < 0) {
            percentCell.style.color = "#4ade80";
        }

        row.appendChild(percentCell);

        // 資料日期
        const dateCell = document.createElement("td");

        dateCell.textContent = quote ? quote.date : "—";

        dateCell.style.fontSize = "12px";
        dateCell.style.color = "#8b93a1";

        row.appendChild(dateCell);

        // 刪除按鈕
        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.textContent = "刪除";
        deleteButton.className = "delete-button";

        deleteButton.addEventListener("click", function() {
            stocks = stocks.filter(function(item) {
                return String(item.code) !== code;
            });

            delete priceData[code];
            delete priceErrors[code];

            saveStocks();
            renderStocks();
        });

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

    const codeInput = document.createElement("input");
    codeInput.placeholder = "股票代號";
    codeInput.className = "stock-input";

    const nameInput = document.createElement("input");
    nameInput.placeholder = "股票名稱";
    nameInput.className = "stock-input";

    const addButton = document.createElement("button");
    addButton.textContent = "＋ 新增";
    addButton.className = "add-button";

    addButton.addEventListener("click", async function() {
        const code = codeInput.value.trim();
        const name = nameInput.value.trim();

        if (!code) {
            alert("請輸入股票代號");
            return;
        }

        const alreadyExists = stocks.some(function(stock) {
            return String(stock.code) === code;
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

        // 清除舊的報價紀錄，再重新取得資料
        delete priceData[code];
        delete priceErrors[code];

        await refreshPrices();
    });

    form.appendChild(codeInput);
    form.appendChild(nameInput);
    form.appendChild(addButton);

    container.appendChild(form);
}


// ========================================
// 網頁載入
// ========================================

document.addEventListener("DOMContentLoaded", async function() {
    const hasLocalData = loadLocalStocks();

    if (!hasLocalData) {
        await loadStocks();
    }

    renderStocks();

    if (stocks.length > 0) {
        await refreshPrices();
    }
});
