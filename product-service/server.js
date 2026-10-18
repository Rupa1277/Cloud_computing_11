// MICROSERVICE 2: Product service (own DB: productdb)
const express=require('express'),cors=require('cors'),crypto=require('crypto'),os=require('os'),{promisify}=require('util'),{Pool}=require('pg');
const pbkdf2=promisify(crypto.pbkdf2);
const app=express();app.use(cors(),express.json());
const db=new Pool({connectionString:process.env.DATABASE_URL});
const VM=process.env.VM_NAME||os.hostname();
async function ready(sql){for(let i=0;i<30;i++){try{await db.query(sql);return}catch(e){console.log('waiting for DB...');await new Promise(r=>setTimeout(r,2000))}}throw new Error('DB not reachable')}
const SEED="INSERT INTO products(name,price,description,emoji) SELECT v.* FROM (VALUES ('Laptop',55000,'14 inch, 16GB RAM','💻'),('Smartphone',20000,'5G, 128GB','📱'),('Headphones',2500,'Wireless, noise cancelling','🎧'),('Smart Watch',4000,'Fitness tracking','⌚'),('Backpack',1200,'Water resistant','🎒'),('Keyboard',1800,'Mechanical RGB','⌨️')) AS v(name,price,description,emoji) WHERE NOT EXISTS (SELECT 1 FROM products);";
app.get('/health',(_,r)=>r.send('ok'));
app.get('/api/products/whoami',(_,r)=>r.json({served_by:VM}));   // proves load balancing
app.get('/api/products/stress',async(_,r)=>{                      // CPU-heavy request (simulated recommendation scoring)
  await pbkdf2('load','salt',150000,64,'sha512');
  r.json({served_by:VM,done:true});
});
app.get('/api/products',async(_,r)=>{r.set('X-Served-By',VM);r.json((await db.query('SELECT * FROM products ORDER BY id')).rows)});
ready('CREATE TABLE IF NOT EXISTS products(id SERIAL PRIMARY KEY,name TEXT,price INT,description TEXT,emoji TEXT)')
 .then(()=>db.query(SEED)).then(()=>app.listen(3000,()=>console.log('Product service on 3000')));
