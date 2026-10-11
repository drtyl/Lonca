// Bu dosya GitHub Actions'ta tek bir js/vendor.js dosyasına paketlenir.
// Uygulama 3D kütüphaneleri internetten değil, kendi içinden yükler.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

window.LONCA3D = { THREE, GLTFLoader, VRMLoaderPlugin, VRMUtils };
