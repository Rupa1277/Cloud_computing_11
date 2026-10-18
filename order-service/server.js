// MICROSERVICE 3: Order service = cart + payment (own DB: orderdb)
const express=require('express'),cors=require('cors'),os=require('os'),{Pool}=require('pg');
const app=express();app.use(cors(),express.json());
const db=new Pool({connectionString:process.env.DATABASE_URL});
const VM=process.env.VM_NAME||os.hostname();
async function ready(sql){for(let i=0;i<30;i++){try{await db.query(sql);return}catch(e){console.log('waiting for DB...');await new Promise(r=>setTimeout(r,2000))}}throw new Error('DB not reachable')}
app.get('/health',(_,r)=>r.send('ok'));
app.get('/api/cart',async(_,r)=>{r.set('X-Served-By',VM);r.json((await db.query('SELECT * FROM cart ORDER BY id')).rows)});
app.post('/api/cart',async(q,r)=>{
  const {product_id,name,price}=q.body;
  const u=await db.query('UPDATE cart SET qty=qty+1 WHERE product_id=$1 RETURNING *',[product_id]);
  if(!u.rowCount)await db.query('INSERT INTO cart(product_id,name,price,qty) VALUES($1,$2,$3,1)',[product_id,name,price]);
  r.json({ok:true});
});
app.delete('/api/cart/:id',async(q,r)=>{await db.query('DELETE FROM cart WHERE id=$1',[q.params.id]);r.json({ok:true})});
app.post('/api/payment',async(q,r)=>{
  const items=(await db.query('SELECT * FROM cart')).rows;
  if(!items.length)return r.status(400).json({error:'Cart is empty'});
  const total=items.reduce((s,i)=>s+i.price*i.qty,0);
  const o=await db.query('INSERT INTO orders(customer,total) VALUES($1,$2) RETURNING id',[q.body.name,total]);
  await db.query('DELETE FROM cart');
  r.json({orderId:o.rows[0].id,total});
});
ready(`CREATE TABLE IF NOT EXISTS cart(id SERIAL PRIMARY KEY,product_id INT,name TEXT,price INT,qty INT);
CREATE TABLE IF NOT EXISTS orders(id SERIAL PRIMARY KEY,customer TEXT,total INT,created_at TIMESTAMP DEFAULT now());`)
 .then(()=>app.listen(3000,()=>console.log('Order service on 3000')));
