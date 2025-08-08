// See https://github.com/typicode/json-server#module
const jsonServer = require('json-server');
const auth = require('json-server-auth');
const path = require('path');

const server = jsonServer.create();

// Uncomment to allow write operations
// const fs = require('fs')
// const path = require('path')
// const filePath = path.join('db.json')
// const data = fs.readFileSync(filePath, "utf-8");
// const db = JSON.parse(data);
// const router = jsonServer.router(db)

// Comment out to allow write operations
const router = jsonServer.router(path.join(__dirname, '..', 'db.json'));
const middlewares = jsonServer.defaults();

server.db = router.db;

const rules = auth.rewriter({
  users: 660, // 登入的使用者才能讀取 users 資料
  // 你未來可以增加更多自訂規則
  '/api/*': '/$1',
  '/blog/:resource/:id/show': '/:resource/:id',
});

server.use(middlewares);

server.get('/sitters', (req, res) => {
  try {
    const db = router.db;
    // 1. 從請求物件(req)的 query 屬性中，讀取查詢參數
    const city = req.query['address.city']; // Express 會自動解析 URL query string

    // 2. 建立一個基本的篩選條件物件
    const filterCriteria = { role: 'sitter' };

    // 3. 如果 URL 中真的有 address.city 參數，就把它加到篩選條件中
    //    Lodash 支援深度篩選！
    if (city) {
      filterCriteria.address = { city: city };
    }

    // 4. 將組合好的篩選條件傳給 filter 函式
    const sitters = db.get('users').filter(filterCriteria).value();

    // 移除敏感資料
    const publicSitters = sitters.map((sitter) => {
      const { password, googleId, phone, bankAccountDetails, ...publicData } =
        sitter;
      return publicData;
    });

    res.jsonp(publicSitters);
  } catch (error) {
    res.status(500).jsonp({ error: 'Could not fetch sitters' });
  }
});

server.get('/sitters/:id', (req, res) => {
  try {
    const db = router.db;
    // 1. 從 req.params 中獲取 URL 上的 id，並轉換為數字
    const id = parseInt(req.params.id, 10);

    // 2. 使用 .find() 來尋找唯一符合條件的 user
    const sitter = db.get('users').find({ id: id, role: 'sitter' }).value();

    // 3. 判斷是否找到
    if (sitter) {
      // 找到後，同樣移除敏感資料
      const { password, ...publicData } = sitter;
      res.jsonp(publicData);
    } else {
      // 如果找不到，回傳 404 Not Found 錯誤，這更符合 RESTful API 的語意
      res.status(404).jsonp({ error: 'Sitter not found' });
    }
  } catch (error) {
    console.error(`Error fetching sitter with id ${req.params.id}:`, error);
    res.status(500).jsonp({ error: 'Could not fetch sitter' });
  }
});
// 1. 先套用規則
server.use(rules);
// 2. 再載入 auth 中介軟體
// 3. 接著是 json-server 預設的中介軟體
server.use(auth);
// 4. 最後才是 API 的主路由
server.use(router);

// Add this before server.use(router)
// server.use(jsonServer.rewriter({
//     '/api/*': '/$1',
//     '/blog/:resource/:id/show': '/:resource/:id'
// }))
// server.listen(3000, () => {
//     console.log('JSON Server is running')
// })
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`JSON Server with Auth is running on port ${PORT}`);
});

// Export the Server API
module.exports = server;
