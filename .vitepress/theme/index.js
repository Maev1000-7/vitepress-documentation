// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme';
import VersionSwitcher from '@viteplus/versions/components/version-switcher.component.vue';
import { createVuetify } from 'vuetify';

import 'vuetify/styles';
// import '@mdi/font/css/materialdesignicons.css';

import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';



export default {
    extends: DefaultTheme,
    enhanceApp({ app }) {
        
        const vuetify = createVuetify({
            ssr: true, 
            components, 
            directives  
        });

        app.component('VersionSwitcher', VersionSwitcher);
        app.use(vuetify);
    } 
};