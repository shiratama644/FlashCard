import './style/main.css';
import Alpine from 'alpinejs';
import collapse from '@alpinejs/collapse';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { flashcardApp } from './js/app/index.js';

// Alpineプラグインの登録
Alpine.plugin(collapse);

// 元のコードがグローバル変数として参照しているためwindowに登録
window.gsap = gsap;
window.confetti = confetti;

// Alpine Component Initialization
document.addEventListener('alpine:init', () => {
  Alpine.data('flashcardApp', flashcardApp);
});

// Alpine.js の起動
Alpine.start();