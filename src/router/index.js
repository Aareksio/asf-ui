import Vue from 'vue';
import VueRouter from 'vue-router';
import store from '../store';
import VueMeta from 'vue-meta';

import { parse } from 'url';

Vue.use(VueRouter);
Vue.use(VueMeta);

import routes from './routes';

const router = new VueRouter({
	routes,
	base: parse(store.getters['auth/baseURL']).path,
	mode: 'history',
	scrollBehavior(to, from, savedPosition) {
		return savedPosition || { x: 0, y: 0 };
	}
});

router.beforeEach(async (routeTo, routeFrom, next) => {
	const noPasswordRequired = routeTo.matched.every(route => route.meta.noPasswordRequired);
	if (noPasswordRequired) return next();

	const validPassword = store.getters['auth/validPassword'] || await store.dispatch('auth/validate');
	if (validPassword) return next();

	return next({ name: 'setup' });
});

export default router;
