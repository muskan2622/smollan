
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Navbar.svelte generated by Svelte v3.59.2 */

    const file$3 = "src/Navbar.svelte";

    function create_fragment$3(ctx) {
    	let nav;
    	let img;
    	let img_src_value;
    	let t0;
    	let h1;
    	let t1;
    	let t2;
    	let ul;
    	let li0;
    	let a0;
    	let t4;
    	let li1;
    	let a1;
    	let t6;
    	let li2;
    	let a2;
    	let t8;
    	let li3;
    	let a3;
    	let t10;
    	let li4;
    	let a4;
    	let t12;
    	let li5;
    	let a5;
    	let t14;
    	let li6;
    	let a6;
    	let t16;
    	let li7;
    	let a7;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			img = element("img");
    			t0 = space();
    			h1 = element("h1");
    			t1 = text(/*title*/ ctx[0]);
    			t2 = space();
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Forecasts";
    			t4 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Maps";
    			t6 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Alerts";
    			t8 = space();
    			li3 = element("li");
    			a3 = element("a");
    			a3.textContent = "Life";
    			t10 = space();
    			li4 = element("li");
    			a4 = element("a");
    			a4.textContent = "News & Videos";
    			t12 = space();
    			li5 = element("li");
    			a5 = element("a");
    			a5.textContent = "Cameras";
    			t14 = space();
    			li6 = element("li");
    			a6 = element("a");
    			a6.textContent = "Air Quality";
    			t16 = space();
    			li7 = element("li");
    			a7 = element("a");
    			a7.textContent = "Hurricane";
    			if (!src_url_equal(img.src, img_src_value = /*logoPath*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Logo");
    			attr_dev(img, "class", "logo svelte-ger7xi");
    			add_location(img, file$3, 9, 2, 167);
    			add_location(h1, file$3, 12, 2, 234);
    			attr_dev(a0, "href", "./Forecast");
    			attr_dev(a0, "class", "svelte-ger7xi");
    			add_location(a0, file$3, 16, 8, 315);
    			attr_dev(li0, "class", "svelte-ger7xi");
    			add_location(li0, file$3, 16, 4, 311);
    			attr_dev(a1, "href", "#");
    			attr_dev(a1, "class", "svelte-ger7xi");
    			add_location(a1, file$3, 17, 8, 363);
    			attr_dev(li1, "class", "svelte-ger7xi");
    			add_location(li1, file$3, 17, 4, 359);
    			attr_dev(a2, "href", "#");
    			attr_dev(a2, "class", "svelte-ger7xi");
    			add_location(a2, file$3, 18, 8, 397);
    			attr_dev(li2, "class", "svelte-ger7xi");
    			add_location(li2, file$3, 18, 4, 393);
    			attr_dev(a3, "href", "#");
    			attr_dev(a3, "class", "svelte-ger7xi");
    			add_location(a3, file$3, 19, 8, 433);
    			attr_dev(li3, "class", "svelte-ger7xi");
    			add_location(li3, file$3, 19, 4, 429);
    			attr_dev(a4, "href", "#");
    			attr_dev(a4, "class", "svelte-ger7xi");
    			add_location(a4, file$3, 20, 8, 467);
    			attr_dev(li4, "class", "svelte-ger7xi");
    			add_location(li4, file$3, 20, 4, 463);
    			attr_dev(a5, "href", "#");
    			attr_dev(a5, "class", "svelte-ger7xi");
    			add_location(a5, file$3, 21, 8, 510);
    			attr_dev(li5, "class", "svelte-ger7xi");
    			add_location(li5, file$3, 21, 4, 506);
    			attr_dev(a6, "href", "#");
    			attr_dev(a6, "class", "svelte-ger7xi");
    			add_location(a6, file$3, 22, 8, 547);
    			attr_dev(li6, "class", "svelte-ger7xi");
    			add_location(li6, file$3, 22, 4, 543);
    			attr_dev(a7, "href", "#");
    			attr_dev(a7, "class", "svelte-ger7xi");
    			add_location(a7, file$3, 23, 8, 588);
    			attr_dev(li7, "class", "svelte-ger7xi");
    			add_location(li7, file$3, 23, 4, 584);
    			attr_dev(ul, "class", "nav-links svelte-ger7xi");
    			add_location(ul, file$3, 15, 2, 284);
    			attr_dev(nav, "class", "navbar svelte-ger7xi");
    			add_location(nav, file$3, 7, 0, 128);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, img);
    			append_dev(nav, t0);
    			append_dev(nav, h1);
    			append_dev(h1, t1);
    			append_dev(nav, t2);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t4);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(ul, t6);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(ul, t8);
    			append_dev(ul, li3);
    			append_dev(li3, a3);
    			append_dev(ul, t10);
    			append_dev(ul, li4);
    			append_dev(li4, a4);
    			append_dev(ul, t12);
    			append_dev(ul, li5);
    			append_dev(li5, a5);
    			append_dev(ul, t14);
    			append_dev(ul, li6);
    			append_dev(li6, a6);
    			append_dev(ul, t16);
    			append_dev(ul, li7);
    			append_dev(li7, a7);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*logoPath*/ 2 && !src_url_equal(img.src, img_src_value = /*logoPath*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*title*/ 1) set_data_dev(t1, /*title*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navbar', slots, []);
    	let { title } = $$props;
    	let { logoPath = "/logo-white.svg" } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (title === undefined && !('title' in $$props || $$self.$$.bound[$$self.$$.props['title']])) {
    			console.warn("<Navbar> was created without expected prop 'title'");
    		}
    	});

    	const writable_props = ['title', 'logoPath'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('logoPath' in $$props) $$invalidate(1, logoPath = $$props.logoPath);
    	};

    	$$self.$capture_state = () => ({ title, logoPath });

    	$$self.$inject_state = $$props => {
    		if ('title' in $$props) $$invalidate(0, title = $$props.title);
    		if ('logoPath' in $$props) $$invalidate(1, logoPath = $$props.logoPath);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, logoPath];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { title: 0, logoPath: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get title() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get logoPath() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set logoPath(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* src/WeatherApp.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file$2 = "src/WeatherApp.svelte";

    // (46:27) 
    function create_if_block_1(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*errorMessage*/ ctx[2]);
    			add_location(p, file$2, 46, 6, 1625);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*errorMessage*/ 4) set_data_dev(t, /*errorMessage*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(46:27) ",
    		ctx
    	});

    	return block;
    }

    // (37:4) {#if weatherData}
    function create_if_block(ctx) {
    	let div;
    	let h2;
    	let t0_value = /*weatherData*/ ctx[1].name + "";
    	let t0;
    	let t1;
    	let t2_value = /*weatherData*/ ctx[1].sys.country + "";
    	let t2;
    	let t3;
    	let p0;
    	let t4;
    	let t5_value = /*weatherData*/ ctx[1].main.temp + "";
    	let t5;
    	let t6;
    	let t7;
    	let p1;
    	let t8;
    	let t9_value = /*weatherData*/ ctx[1].weather[0].description + "";
    	let t9;
    	let t10;
    	let p2;
    	let t11;
    	let t12_value = /*weatherData*/ ctx[1].wind.speed + "";
    	let t12;
    	let t13;
    	let t14;
    	let p3;
    	let t15;
    	let t16_value = /*weatherData*/ ctx[1].main.humidity + "";
    	let t16;
    	let t17;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = text(", ");
    			t2 = text(t2_value);
    			t3 = space();
    			p0 = element("p");
    			t4 = text("Temperature: ");
    			t5 = text(t5_value);
    			t6 = text("°C");
    			t7 = space();
    			p1 = element("p");
    			t8 = text("Description: ");
    			t9 = text(t9_value);
    			t10 = space();
    			p2 = element("p");
    			t11 = text("Wind Speed: ");
    			t12 = text(t12_value);
    			t13 = text(" m/s");
    			t14 = space();
    			p3 = element("p");
    			t15 = text("Humidity: ");
    			t16 = text(t16_value);
    			t17 = text("%");
    			add_location(h2, file$2, 38, 8, 1233);
    			add_location(p0, file$2, 39, 8, 1296);
    			add_location(p1, file$2, 40, 8, 1350);
    			add_location(p2, file$2, 41, 8, 1415);
    			add_location(p3, file$2, 42, 8, 1471);
    			attr_dev(div, "class", "weather-info svelte-1immaux");
    			add_location(div, file$2, 37, 6, 1198);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(div, t3);
    			append_dev(div, p0);
    			append_dev(p0, t4);
    			append_dev(p0, t5);
    			append_dev(p0, t6);
    			append_dev(div, t7);
    			append_dev(div, p1);
    			append_dev(p1, t8);
    			append_dev(p1, t9);
    			append_dev(div, t10);
    			append_dev(div, p2);
    			append_dev(p2, t11);
    			append_dev(p2, t12);
    			append_dev(p2, t13);
    			append_dev(div, t14);
    			append_dev(div, p3);
    			append_dev(p3, t15);
    			append_dev(p3, t16);
    			append_dev(p3, t17);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*weatherData*/ 2 && t0_value !== (t0_value = /*weatherData*/ ctx[1].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*weatherData*/ 2 && t2_value !== (t2_value = /*weatherData*/ ctx[1].sys.country + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*weatherData*/ 2 && t5_value !== (t5_value = /*weatherData*/ ctx[1].main.temp + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*weatherData*/ 2 && t9_value !== (t9_value = /*weatherData*/ ctx[1].weather[0].description + "")) set_data_dev(t9, t9_value);
    			if (dirty & /*weatherData*/ 2 && t12_value !== (t12_value = /*weatherData*/ ctx[1].wind.speed + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*weatherData*/ 2 && t16_value !== (t16_value = /*weatherData*/ ctx[1].main.humidity + "")) set_data_dev(t16, t16_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(37:4) {#if weatherData}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let main;
    	let h1;
    	let t1;
    	let div0;
    	let input;
    	let t2;
    	let button;
    	let t4;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*weatherData*/ ctx[1]) return create_if_block;
    		if (/*errorMessage*/ ctx[2]) return create_if_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "To match the endpoints search for London or Mantilly";
    			t1 = space();
    			div0 = element("div");
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			button.textContent = "Search";
    			t4 = space();
    			if (if_block) if_block.c();
    			add_location(h1, file$2, 28, 3, 860);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Enter city name or zip code");
    			attr_dev(input, "class", "svelte-1immaux");
    			add_location(input, file$2, 31, 6, 981);
    			attr_dev(button, "class", "svelte-1immaux");
    			add_location(button, file$2, 32, 6, 1074);
    			attr_dev(div0, "class", "search-bar svelte-1immaux");
    			add_location(div0, file$2, 30, 4, 950);
    			attr_dev(main, "class", "weather-app svelte-1immaux");
    			add_location(main, file$2, 27, 2, 830);
    			attr_dev(div1, "class", "background-image svelte-1immaux");
    			add_location(div1, file$2, 26, 0, 797);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, main);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*searchQuery*/ ctx[0]);
    			append_dev(div0, t2);
    			append_dev(div0, button);
    			append_dev(main, t4);
    			if (if_block) if_block.m(main, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    					listen_dev(button, "click", /*searchLocation*/ ctx[3], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*searchQuery*/ 1 && input.value !== /*searchQuery*/ ctx[0]) {
    				set_input_value(input, /*searchQuery*/ ctx[0]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(main, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);

    			if (if_block) {
    				if_block.d();
    			}

    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('WeatherApp', slots, []);
    	let searchQuery = '';
    	let weatherData = null;
    	let errorMessage = '';

    	// Function to handle search
    	async function searchLocation() {
    		try {
    			// Fetch weather data based on search query
    			const response = await fetch(`http://api.openweathermap.org/data/2.5/weather?q=${searchQuery}&appid=c685801635d2b619a59a4b856f94f36b`);

    			const data = await response.json();

    			// Store weather data
    			$$invalidate(1, weatherData = data);

    			$$invalidate(2, errorMessage = ''); // Reset error message if successful
    		} catch(error) {
    			console.error('Error fetching weather data:', error);
    			$$invalidate(2, errorMessage = 'Error fetching weather data. Please try again later.');
    			$$invalidate(1, weatherData = null);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<WeatherApp> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		searchQuery = this.value;
    		$$invalidate(0, searchQuery);
    	}

    	$$self.$capture_state = () => ({
    		writable,
    		searchQuery,
    		weatherData,
    		errorMessage,
    		searchLocation
    	});

    	$$self.$inject_state = $$props => {
    		if ('searchQuery' in $$props) $$invalidate(0, searchQuery = $$props.searchQuery);
    		if ('weatherData' in $$props) $$invalidate(1, weatherData = $$props.weatherData);
    		if ('errorMessage' in $$props) $$invalidate(2, errorMessage = $$props.errorMessage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [searchQuery, weatherData, errorMessage, searchLocation, input_input_handler];
    }

    class WeatherApp extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WeatherApp",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/About.svelte generated by Svelte v3.59.2 */

    const file$1 = "src/About.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let div6;
    	let h1;
    	let t1;
    	let div0;
    	let h20;
    	let t3;
    	let p0;
    	let t5;
    	let div1;
    	let h21;
    	let t7;
    	let p1;
    	let t9;
    	let div2;
    	let h22;
    	let t11;
    	let p2;
    	let t13;
    	let pre;
    	let t15;
    	let div3;
    	let h23;
    	let t17;
    	let ul;
    	let li0;
    	let strong0;
    	let t19;
    	let t20;
    	let li1;
    	let strong1;
    	let t22;
    	let t23;
    	let div4;
    	let h24;
    	let t25;
    	let p3;
    	let t27;
    	let div5;
    	let h25;
    	let t29;
    	let p4;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div6 = element("div");
    			h1 = element("h1");
    			h1.textContent = "OpenWeatherMap API Documentation";
    			t1 = space();
    			div0 = element("div");
    			h20 = element("h2");
    			h20.textContent = "API Overview";
    			t3 = space();
    			p0 = element("p");
    			p0.textContent = "The OpenWeatherMap API is a powerful tool for accessing current weather data and forecasts for various locations around the world. It provides developers with access to a wide range of weather-related information, including temperature, humidity, wind speed, atmospheric pressure, and more.";
    			t5 = space();
    			div1 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Usage";
    			t7 = space();
    			p1 = element("p");
    			p1.textContent = "To use the OpenWeatherMap API, you need to sign up for an API key, which allows you to access the data. The API key is typically included as a query parameter in the API requests to authenticate your access.";
    			t9 = space();
    			div2 = element("div");
    			h22 = element("h2");
    			h22.textContent = "Endpoint";
    			t11 = space();
    			p2 = element("p");
    			p2.textContent = "The main endpoint for accessing weather data is:";
    			t13 = space();
    			pre = element("pre");
    			pre.textContent = "http://api.openweathermap.org/data/2.5/weather";
    			t15 = space();
    			div3 = element("div");
    			h23 = element("h2");
    			h23.textContent = "Parameters";
    			t17 = space();
    			ul = element("ul");
    			li0 = element("li");
    			strong0 = element("strong");
    			strong0.textContent = "q:";
    			t19 = text(" The city name and country code separated by a comma (e.g., \"Mantilly,FR\"). This parameter specifies the location for which you want to retrieve weather data.");
    			t20 = space();
    			li1 = element("li");
    			strong1 = element("strong");
    			strong1.textContent = "appid:";
    			t22 = text(" Your API key obtained from OpenWeatherMap. This parameter authenticates your access to the API.");
    			t23 = space();
    			div4 = element("div");
    			h24 = element("h2");
    			h24.textContent = "Response";
    			t25 = space();
    			p3 = element("p");
    			p3.textContent = "The API response is in JSON format and includes various weather-related parameters such as temperature, humidity, wind speed, weather description, and more.";
    			t27 = space();
    			div5 = element("div");
    			h25 = element("h2");
    			h25.textContent = "List of Countries Supported";
    			t29 = space();
    			p4 = element("p");
    			p4.textContent = "Please the end points to search for the country.";
    			attr_dev(h1, "class", "svelte-1wgwqgk");
    			add_location(h1, file$1, 2, 4, 41);
    			attr_dev(h20, "class", "svelte-1wgwqgk");
    			add_location(h20, file$1, 4, 6, 115);
    			add_location(p0, file$1, 5, 6, 143);
    			attr_dev(div0, "class", "section svelte-1wgwqgk");
    			add_location(div0, file$1, 3, 4, 87);
    			attr_dev(h21, "class", "svelte-1wgwqgk");
    			add_location(h21, file$1, 8, 6, 484);
    			add_location(p1, file$1, 9, 6, 505);
    			attr_dev(div1, "class", "section svelte-1wgwqgk");
    			add_location(div1, file$1, 7, 4, 456);
    			attr_dev(h22, "class", "svelte-1wgwqgk");
    			add_location(h22, file$1, 12, 6, 763);
    			add_location(p2, file$1, 13, 6, 787);
    			add_location(pre, file$1, 14, 6, 849);
    			attr_dev(div2, "class", "section svelte-1wgwqgk");
    			add_location(div2, file$1, 11, 4, 735);
    			attr_dev(h23, "class", "svelte-1wgwqgk");
    			add_location(h23, file$1, 17, 6, 950);
    			add_location(strong0, file$1, 19, 12, 993);
    			add_location(li0, file$1, 19, 8, 989);
    			add_location(strong1, file$1, 20, 12, 1188);
    			add_location(li1, file$1, 20, 8, 1184);
    			add_location(ul, file$1, 18, 6, 976);
    			attr_dev(div3, "class", "section svelte-1wgwqgk");
    			add_location(div3, file$1, 16, 4, 922);
    			attr_dev(h24, "class", "svelte-1wgwqgk");
    			add_location(h24, file$1, 24, 6, 1368);
    			add_location(p3, file$1, 25, 6, 1392);
    			attr_dev(div4, "class", "section svelte-1wgwqgk");
    			add_location(div4, file$1, 23, 4, 1340);
    			attr_dev(h25, "class", "svelte-1wgwqgk");
    			add_location(h25, file$1, 28, 6, 1599);
    			add_location(p4, file$1, 29, 6, 1642);
    			attr_dev(div5, "class", "section svelte-1wgwqgk");
    			add_location(div5, file$1, 27, 4, 1571);
    			attr_dev(div6, "class", "documentation svelte-1wgwqgk");
    			add_location(div6, file$1, 1, 2, 9);
    			attr_dev(main, "class", "svelte-1wgwqgk");
    			add_location(main, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div6);
    			append_dev(div6, h1);
    			append_dev(div6, t1);
    			append_dev(div6, div0);
    			append_dev(div0, h20);
    			append_dev(div0, t3);
    			append_dev(div0, p0);
    			append_dev(div6, t5);
    			append_dev(div6, div1);
    			append_dev(div1, h21);
    			append_dev(div1, t7);
    			append_dev(div1, p1);
    			append_dev(div6, t9);
    			append_dev(div6, div2);
    			append_dev(div2, h22);
    			append_dev(div2, t11);
    			append_dev(div2, p2);
    			append_dev(div2, t13);
    			append_dev(div2, pre);
    			append_dev(div6, t15);
    			append_dev(div6, div3);
    			append_dev(div3, h23);
    			append_dev(div3, t17);
    			append_dev(div3, ul);
    			append_dev(ul, li0);
    			append_dev(li0, strong0);
    			append_dev(li0, t19);
    			append_dev(ul, t20);
    			append_dev(ul, li1);
    			append_dev(li1, strong1);
    			append_dev(li1, t22);
    			append_dev(div6, t23);
    			append_dev(div6, div4);
    			append_dev(div4, h24);
    			append_dev(div4, t25);
    			append_dev(div4, p3);
    			append_dev(div6, t27);
    			append_dev(div6, div5);
    			append_dev(div5, h25);
    			append_dev(div5, t29);
    			append_dev(div5, p4);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('About', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let navbar;
    	let t0;
    	let weatherapp;
    	let t1;
    	let about;
    	let current;

    	navbar = new Navbar({
    			props: { title: "Smollan India Private Limited" },
    			$$inline: true
    		});

    	weatherapp = new WeatherApp({ $$inline: true });
    	about = new About({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			create_component(weatherapp.$$.fragment);
    			t1 = space();
    			create_component(about.$$.fragment);
    			attr_dev(main, "class", "svelte-1nd5vak");
    			add_location(main, file, 6, 0, 149);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(navbar, main, null);
    			append_dev(main, t0);
    			mount_component(weatherapp, main, null);
    			append_dev(main, t1);
    			mount_component(about, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(weatherapp.$$.fragment, local);
    			transition_in(about.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(weatherapp.$$.fragment, local);
    			transition_out(about.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navbar);
    			destroy_component(weatherapp);
    			destroy_component(about);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Navbar, WeatherApp, About });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
