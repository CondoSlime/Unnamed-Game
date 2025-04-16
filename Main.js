//npm run dev
import { createApp } from 'vue'
import App from './App.vue'
// Import Bootstrap and BootstrapVue CSS files (order is important)
import './assets/main.css'
import './css/Main.css';
import './css/Default.css';


/*
npm run build
open cmd and navigate to dist cd "C:\Users\MiPC\Desktop\projects\VScode\unnamed-project\dist"
OR right click dist folder and press "Open in integrated terminal"
git branch -M main                                                   
git remote add origin https://github.com/CondoSlime/Unnamed-Game.git
git add .
git commit -m "whatever"
git push origin main
git push origin main --force
^ overrides changes made on the branch that are on the github but not on the local*/


const app = createApp(App);
app.mount('#app');
