// See https://github.com/typicode/json-server#module
const jsonServer = require('json-server')
const auth = require('json-server-auth'); 
const path = require('path');

const server = jsonServer.create()


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
  '/blog/:resource/:id/show': '/:resource/:id'
});

server.use(middlewares);

server.get('/sitters', (req, res) => {
  try {
    const db = router.db;
    const sitters = db.get('users').filter({ role: 'sitter' }).value();
    
    // 移除敏感資料
    const publicSitters = sitters.map(sitter => {
      const { password, googleId, phone, address, bankAccountDetails, ...publicData } = sitter;
      return publicData;
    });
    
    res.jsonp(publicSitters);
  } catch (error) {
    res.status(500).jsonp({ error: 'Could not fetch sitters' });
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
module.exports = server
