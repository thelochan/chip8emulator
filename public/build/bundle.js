
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
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
    function empty() {
        return text('');
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
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
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
            ctx: null,
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
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.42.6' }, detail), true));
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
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
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    /**
     * Decode arguments from opcodes which don't have any arguments
     * @param opcode
     * @returns
     */
    function nullDecoder(opcode) {
        return {};
    }
    /**
     * Decode arguments from opcodes of format NNN
     * @param opcode
     * @returns
     */
    function nnnDecoder(opcode) {
        const nnn = opcode & 0x0fff;
        return { nnn };
    }
    /**
     * Decode arguments from opcodes of format XKK
     * @param opcode
     * @returns
     */
    function xkkDecoder(opcode) {
        const xkk = opcode & 0x0fff;
        return { x: xkk >> 8, kk: xkk & 0x0ff };
    }
    /**
     * Decode arguments from opcodes of format XY
     * @param opcode
     * @returns
     */
    function xyDecoder(opcode) {
        const xy = (opcode & 0x0ff0) >> 4;
        return { x: xy >> 4, y: xy & 0x0f };
    }
    /**
     * Decode arguments from opcodes of format X
     * @param opcode
     * @returns
     */
    function xDecoder(opcode) {
        return { x: (opcode & 0x0f00) >> 8 };
    }
    /**
     * Decode arguments from opcodes of format XYN
     * @param opcode
     * @returns
     */
    function xynDecoder(opcode) {
        const xyn = opcode & 0x0fff;
        return { x: xyn >> 8, y: (xyn & 0x0f0) >> 4, n: xyn & 0x00f };
    }

    /**
     * list of instructions
     */
    const instructions = {
        // 0nnn - SYS addr
        sys: {
            pattern: 0x0000,
            mask: 0xf000,
            decodeArgs: nnnDecoder,
            execute: (cpu) => {
                cpu.pc += 2;
            },
        },
        // 00E0 - CLS
        cls: {
            pattern: 0x00e0,
            mask: 0xffff,
            decodeArgs: nullDecoder,
            execute(cpu) {
                cpu.io.clearDisplay();
                cpu.pc += 2;
            },
        },
        // 00EE - RET
        ret: {
            pattern: 0x00ee,
            mask: 0xffff,
            decodeArgs: nullDecoder,
            execute(cpu) {
                if (cpu.sp <= -1) {
                    throw new Error("Stack Underflow");
                }
                cpu.pc = cpu.stack[cpu.sp];
                cpu.sp--;
            },
        },
        // 1nnn - JP addr
        jmp: {
            pattern: 0x1000,
            mask: 0xf000,
            decodeArgs: nnnDecoder,
            execute(cpu, args) {
                const { nnn } = args;
                cpu.pc = nnn;
            },
        },
        // 2nnn - CALL addr
        call: {
            pattern: 0x2000,
            mask: 0xf000,
            decodeArgs: nnnDecoder,
            execute(cpu, args) {
                const { nnn } = args;
                cpu.sp++;
                // Note: the COWGOD guide mentions nothing of this +2 - we are meant to infer this
                // because without it the program would go into a neverending infinite loop.
                cpu.stack[cpu.sp] = cpu.pc + 2;
                cpu.pc = nnn;
            },
        },
        // 3xkk - SE Vx, byte
        seq: {
            pattern: 0x3000,
            mask: 0xf000,
            decodeArgs: xkkDecoder,
            execute(cpu, args) {
                const { x, kk } = args;
                cpu.pc += cpu.registers[x] === kk ? 4 : 2;
            },
        },
        // 4xkk - SNE Vx, byte
        sne: {
            pattern: 0x4000,
            mask: 0xf000,
            decodeArgs: xkkDecoder,
            execute(cpu, args) {
                const { x, kk } = args;
                cpu.pc += cpu.registers[x] === kk ? 2 : 4;
            },
        },
        // 5xy0 - SE Vx, Vy
        seqReg: {
            pattern: 0x5000,
            mask: 0xf00f,
            decodeArgs: xyDecoder,
            execute(cpu, args) {
                const { x, y } = args;
                cpu.pc += cpu.registers[x] === cpu.registers[y] ? 4 : 2;
            },
        },
        // 6xkk - LD Vx, byte
        load: {
            pattern: 0x6000,
            mask: 0xf000,
            decodeArgs: xkkDecoder,
            execute(cpu, args) {
                const { x, kk } = args;
                cpu.registers[x] = kk;
                cpu.pc += 2;
            },
        },
        // 7xkk - ADD Vx, byte
        add: {
            pattern: 0x7000,
            mask: 0xf000,
            decodeArgs: xkkDecoder,
            execute(cpu, args) {
                const { x, kk } = args;
                cpu.registers[x] = cpu.registers[x] + kk;
                cpu.pc += 2;
            },
        },
        // 8xy0 - LD Vx, Vy
        loadReg: {
            pattern: 0x8000,
            mask: 0xf00f,
            decodeArgs: xyDecoder,
            execute(cpu, args) {
                const { x, y } = args;
                cpu.registers[x] = cpu.registers[y];
                cpu.pc += 2;
            },
        },
        // 8xy1 - OR Vx, Vy
        or: {
            pattern: 0x8001,
            mask: 0xf00f,
            decodeArgs: xyDecoder,
            execute(cpu, args) {
                const { x, y } = args;
                cpu.registers[x] = cpu.registers[x] | cpu.registers[y];
                cpu.pc += 2;
            },
        },
        // 8xy2 - OR Vx, Vy
        and: {
            pattern: 0x8002,
            mask: 0xf00f,
            decodeArgs: xyDecoder,
            execute(cpu, args) {
                const { x, y } = args;
                cpu.registers[x] = cpu.registers[x] & cpu.registers[y];
                cpu.pc += 2;
            },
        },
        // 8xy3 - XOR Vx, Vy
        xor: {
            pattern: 0x8003,
            mask: 0xf00f,
            decodeArgs: xyDecoder,
            execute(cpu, args) {
                const { x, y } = args;
                cpu.registers[x] = cpu.registers[x] ^ cpu.registers[y];
                cpu.pc += 2;
            },
        },
        // 8xy4 - ADD Vx, Vy
        addReg: {
            pattern: 0x8004,
            mask: 0xf00f,
            decodeArgs: xyDecoder,
            execute(cpu, args) {
                const { x, y } = args;
                const sum = cpu.registers[x] + cpu.registers[y];
                cpu.registers[0xf] = sum > 0xff ? 1 : 0;
                cpu.registers[x] = sum;
                cpu.pc += 2;
            },
        },
        // 8xy5 - SUB Vx, Vy
        sub: {
            pattern: 0x8005,
            mask: 0xf00f,
            decodeArgs: xyDecoder,
            execute(cpu, args) {
                const { x, y } = args;
                cpu.registers[0xf] = cpu.registers[x] > cpu.registers[y] ? 1 : 0;
                cpu.registers[x] = cpu.registers[x] - cpu.registers[y];
                cpu.pc += 2;
            },
        },
        // 8xy6 - SHR Vx {, Vy}
        shr: {
            pattern: 0x8006,
            mask: 0xf00f,
            decodeArgs: xyDecoder,
            execute(cpu, args) {
                const { x } = args;
                cpu.registers[0xf] = cpu.registers[x] & 1; // & 1 gets us the LSB
                cpu.registers[x] = cpu.registers[x] >> 1;
                cpu.pc += 0x2;
            },
        },
        // 8xy7 - SUBN Vx, Vy
        subn: {
            pattern: 0x8007,
            mask: 0xf00f,
            decodeArgs: xyDecoder,
            execute(cpu, args) {
                const { x, y } = args;
                cpu.registers[0xf] = cpu.registers[y] > cpu.registers[x] ? 1 : 0;
                cpu.registers[x] = cpu.registers[y] - cpu.registers[x];
                cpu.pc += 2;
            },
        },
        // 8xyE - SHL Vx {, Vy}
        shl: {
            pattern: 0x800e,
            mask: 0xf00f,
            decodeArgs: xyDecoder,
            execute(cpu, args) {
                const { x } = args;
                cpu.registers[0xf] = cpu.registers[x] >> 7; // >> 7 gets us the MSB in a byte
                cpu.registers[x] = cpu.registers[x] << 1;
                cpu.pc += 2;
            },
        },
        // 9xy0 - SNE Vx, Vy
        sneReg: {
            pattern: 0x9000,
            mask: 0xf00f,
            decodeArgs: xyDecoder,
            execute(cpu, args) {
                const { x, y } = args;
                cpu.pc += cpu.registers[x] !== cpu.registers[y] ? 2 : 4;
            },
        },
        // Annn - LD I, addr
        loadI: {
            pattern: 0xa000,
            mask: 0xf000,
            decodeArgs: nnnDecoder,
            execute(cpu, args) {
                const { nnn } = args;
                cpu.i = nnn;
                cpu.pc += 2;
            },
        },
        // Bnnn - JP V0, addr
        jmpReg: {
            pattern: 0xb000,
            mask: 0xf000,
            decodeArgs: nnnDecoder,
            execute(cpu, args) {
                const { nnn } = args;
                cpu.pc = nnn + cpu.registers[0];
            },
        },
        // Cxkk - RND Vx, byte
        rnd: {
            pattern: 0xc000,
            mask: 0xf000,
            decodeArgs: xkkDecoder,
            execute(cpu, args) {
                const { x, kk } = args;
                cpu.registers[x] = random() & kk;
                cpu.pc += 2;
            },
        },
        // Dxyn - DRW Vx, Vy, nibble
        draw: {
            pattern: 0xd000,
            mask: 0xf000,
            decodeArgs: xynDecoder,
            execute(cpu, args) {
                const { x, y, n } = args;
                cpu.registers[0xf] = cpu.io.drawSprite(cpu.memory.slice(cpu.i, cpu.i + n), cpu.registers[x], cpu.registers[y])
                    ? 1
                    : 0;
                cpu.pc += 2;
            },
        },
        // Ex9E - SKP Vx
        skpKey: {
            pattern: 0xe09e,
            mask: 0xf0ff,
            decodeArgs: xDecoder,
            execute(cpu, args) {
                const { x } = args;
                cpu.pc += cpu.io.isKeyDown(cpu.registers[x]) ? 4 : 2;
            },
        },
        // ExA1 - SKNP Vx
        skpNotKey: {
            pattern: 0xe0a1,
            mask: 0xf0ff,
            decodeArgs: xDecoder,
            execute(cpu, args) {
                const { x } = args;
                cpu.pc += cpu.io.isKeyDown(cpu.registers[x]) ? 2 : 4;
            },
        },
        // Fx07 - LD Vx, DT
        getDelay: {
            pattern: 0xf007,
            mask: 0xf0ff,
            decodeArgs: xDecoder,
            execute(cpu, args) {
                const { x } = args;
                cpu.registers[x] = cpu.delayTimer;
                cpu.pc += 2;
            },
        },
        // Fx0A - LD Vx, K
        waitKey: {
            pattern: 0xf00a,
            mask: 0xf0ff,
            decodeArgs: xDecoder,
            execute(cpu, args) {
                const { x } = args;
                // no pressed keys - do nothing and return
                if (cpu.io.pressedKeys === 0)
                    return;
                // A key is pressed - get the last one pressed and put it into the register
                cpu.registers[x] = cpu.io.lastKeyPressed;
                cpu.pc += 2;
            },
        },
        // Fx15 - LD DT, Vx
        setDelay: {
            pattern: 0xf015,
            mask: 0xf0ff,
            decodeArgs: xDecoder,
            execute(cpu, args) {
                cpu.delayTimer = cpu.registers[0];
                cpu.pc += 2;
            },
        },
        // Fx18 - LD ST, Vx
        setSound: {
            pattern: 0xf018,
            mask: 0xf0ff,
            decodeArgs: xDecoder,
            execute(cpu, args) {
                cpu.soundTimer = cpu.registers[0];
                cpu.pc += 2;
            },
        },
        // Fx1E - ADD I, Vx
        addIReg: {
            pattern: 0xf01e,
            mask: 0xf0ff,
            decodeArgs: xDecoder,
            execute(cpu, args) {
                const { x } = args;
                cpu.i = cpu.i + cpu.registers[x];
                cpu.pc += 2;
            },
        },
        // Fx29 - LD F, Vx
        loadHexSprite: {
            pattern: 0xf029,
            mask: 0xf0ff,
            decodeArgs: xDecoder,
            execute(cpu, args) {
                const { x } = args;
                cpu.i = cpu.registers[x] * 5;
                cpu.pc += 2;
            },
        },
        // Fx33 - LD B, Vx
        loadBCD: {
            pattern: 0xf033,
            mask: 0xf0ff,
            decodeArgs: xDecoder,
            execute(cpu, args) {
                const { x } = args;
                // hundreds
                cpu.memory[cpu.i] = Math.floor(cpu.registers[x] / 100);
                // tens
                cpu.memory[cpu.i + 1] = Math.floor(cpu.registers[x] / 10) % 10;
                // units
                cpu.memory[cpu.i + 2] = cpu.registers[x] % 10;
                cpu.pc += 2;
            },
        },
        // Fx55 - LD [I], Vx
        storeMem: {
            pattern: 0xf055,
            mask: 0xf0ff,
            decodeArgs: xDecoder,
            execute(cpu, args) {
                const { x } = args;
                for (let i = 0; i <= x; i++) {
                    cpu.memory[cpu.i + i] = cpu.registers[i];
                }
                cpu.pc += 2;
            },
        },
        // Fx65 - LD Vx, [I]
        readMem: {
            pattern: 0xf065,
            mask: 0xf0ff,
            decodeArgs: xDecoder,
            execute(cpu, args) {
                const { x } = args;
                for (let i = 0; i <= x; i++) {
                    cpu.registers[i] = cpu.memory[cpu.i + i];
                }
                cpu.pc += 2;
            },
        },
    };

    /**
     * the DECODE part of the FDE cycle
     * @param opcode the opcode to decode (2 bytes)
     * @returns an object identifying the instruction that fired and that instruction's arguments
     */
    function decode(opcode) {
        // An opcode in chip8 is represented by a "word" (a.k.a 16 bits, 2 bytes or 4 hex digits)
        // the way chip8 works is that there are "patterns" within the hex codes. For example,
        // the opcode for loading a value into a register is 6xkk, where the "x" is the register number
        // and the "kk" is the value (two hexes, so a byte) to load into it - meaning that an opcode
        // of "6E10" would load the value "10" into register "E".
        const instructionMetadata = findByBytecode(opcode);
        return {
            instruction: instructionMetadata,
            args: instructionMetadata.decodeArgs(opcode),
        };
    }
    /**
     * Reterieve instruction based on opcode.
     * @param byteCode a 16-bit opcode that should match to one of the instructions
     * @returns the matched instruction
     * @throws error if no instruction matches passed-in opcode
     */
    function findByBytecode(opcode) {
        const opcodeValues = Object.values(instructions);
        const retVal = 
        // some opcodes are literals - in which case return those before pattern matching.
        opcodeValues.find((o) => o.pattern === opcode) ||
            // otherwise resort to applying bitmasks to discover correct instruction represented
            opcodeValues.find((o) => (o.mask & opcode) === o.pattern);
        if (retVal) {
            return retVal;
        }
        else {
            throw new Error("Opcode not matched");
        }
    }
    // generate a random number between 0 and 255
    function random() {
        return Math.floor(Math.random() * 255);
    }

    function createMemoryIO() {
        return {
            /** Keyboard */
            pressedKeys: 0,
            lastKeyPressed: -1,
            keyDown(key) {
                this.pressedKeys = this.pressedKeys + (1 << key);
                this.lastKeyPressed = key;
            },
            keyUp(key) {
                if (this.isKeyDown(key))
                    this.pressedKeys = this.pressedKeys - (1 << key);
            },
            isKeyDown(key) {
                return ((this.pressedKeys >> key) & 1) === 1;
            },
            /** Display */
            display: createBlankDisplay(),
            // clear the display completely
            clearDisplay() {
                this.display = createBlankDisplay();
            },
            // xor the pixel, return true if the pixel gets blatted as a result (collision)
            drawPixel(value, xOrig, yOrig) {
                const x = xOrig % 64; // wrap around X
                const y = yOrig % 32; // wrap around y
                const original = this.display[y][x];
                this.display[y][x] = this.display[y][x] ^ value;
                return original === 1 && this.display[y][x] === 0;
            },
            /**
             * draw all sprite pixels, return true if this results in any pixels getting blatted (collision)
             * @param sprite sprites are n-bytes long - a byte representing 8 bits with each being 1 pixel.
             * @param x
             * @param y
             */
            drawSprite(sprite, x, y) {
                let collided = false;
                sprite.forEach((row, rowNumber) => {
                    for (let i = 0; i < 8; i++) {
                        if (this.drawPixel((row >> (7 - i)) & 1, x + i, y + rowNumber)) {
                            collided = true;
                        }
                    }
                });
                return collided;
            },
        };
    }
    function createBlankDisplay() {
        return new Array(32).fill(0).map(() => new Array(64).fill(0));
    }

    /**
     * As per http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#dispcoords
     *
     * Programs may also refer to a group of sprites representing the hexadecimal
     * digits 0 through F. These sprites are 5 bytes long, or 8x5 pixels.
     */
    var hexSprites = [
        new Uint8Array([0xf0, 0x90, 0x90, 0x90, 0xf0]),
        new Uint8Array([0x20, 0x60, 0x20, 0x20, 0x70]),
        new Uint8Array([0xf0, 0x10, 0xf0, 0x80, 0xf0]),
        new Uint8Array([0xf0, 0x10, 0xf0, 0x10, 0xf0]),
        new Uint8Array([0x90, 0x90, 0xf0, 0x10, 0x10]),
        new Uint8Array([0xf0, 0x80, 0xf0, 0x10, 0xf0]),
        new Uint8Array([0xf0, 0x80, 0xf0, 0x90, 0xf0]),
        new Uint8Array([0xf0, 0x10, 0x20, 0x40, 0x40]),
        new Uint8Array([0xf0, 0x90, 0xf0, 0x90, 0xf0]),
        new Uint8Array([0xf0, 0x90, 0xf0, 0x10, 0xf0]),
        new Uint8Array([0xf0, 0x90, 0xf0, 0x90, 0x90]),
        new Uint8Array([0xe0, 0x90, 0xe0, 0x90, 0xe0]),
        new Uint8Array([0xf0, 0x80, 0x80, 0x80, 0xf0]),
        new Uint8Array([0xe0, 0x90, 0x90, 0x90, 0xe0]),
        new Uint8Array([0xf0, 0x80, 0xf0, 0x80, 0xf0]),
        new Uint8Array([0xf0, 0x80, 0xf0, 0x80, 0x80]), // F
    ];

    // The first 0x1FF bytes of memory are reserved for the CHIP8 interpreter, so all
    // CHIP8 programs start at 0x200.
    const MEMORY_START = 0x200;
    class Cpu {
        constructor(io = createMemoryIO(), 
        // 4096 bytes of RAM
        memory = new Uint8Array(0x1000), 
        // 16 x 8-bit data registers named V0 to VF
        registers = new Uint8Array(0x10), 
        // 16 x 16-bit values for the stack
        stack = new Uint16Array(0x10), 
        // 16 bit program counter (which starts at 0x200 due to chip8 interpreter taking up the first 512 bytes)
        pc = MEMORY_START, 
        // 8 bit stack pointer
        sp = -1, 
        // 16-bit register called I, This register is generally used to store memory addresses.
        i = -1, 
        // 16 bit delay and sound timers
        soundTimer = 0, delayTimer = 0) {
            this.io = io;
            this.memory = memory;
            this.registers = registers;
            this.stack = stack;
            this.pc = pc;
            this.sp = sp;
            this.i = i;
            this.soundTimer = soundTimer;
            this.delayTimer = delayTimer;
            // Load hex-sprites into memory (there are 15 of these, starting at memory position 0)
            for (let sprite = 0; sprite <= 0xf; sprite++) {
                for (let byte = 0; byte <= 4; byte++) {
                    memory[sprite * 5 + byte] = hexSprites[sprite][byte];
                }
            }
        }
        /**
         *
         * @param this the CPU loading the data
         * @param data the data to load
         */
        load(data) {
            data.forEach((d, i) => {
                this.memory[MEMORY_START + i] = d;
            });
        }
        /**
         * the FETCH part of the FDE cycle
         * @param this the CPU executing the instruction
         * @returns the fetched opcode (which will be 2 bytes long)
         */
        fetch() {
            // fetch the next opcode - each chunk of memory holds a byte (8 bits or 2 hex digits) but
            // the opcodes take up 2 bytes. For this reason, we need to fetch two of them and glue
            // them back together.
            // first thing then - get the byte pointed to by the PC as well as the next byte.
            const chunk1 = this.memory[this.pc];
            const chunk2 = this.memory[this.pc + 1];
            // To combine them, we're going to need to shift the first chunk 1 byte (8 bits) to the left
            // and then add on the second chunk.
            return (chunk1 << 8) + chunk2;
        }
        /**
         * The DECODE part of the FDE cycle
         * (note that this just hands off to a seperate 'decode' function defined elsewhere)
         */
        decode(opcode) {
            return decode(opcode);
        }
        /**
         * The EXECUTE part of the FDE cycle
         */
        execute(instruction, args) {
            instruction.execute(this, args);
            if (this.soundTimer > 0)
                this.soundTimer = this.soundTimer - 1;
            if (this.delayTimer > 0)
                this.delayTimer = this.delayTimer - 1;
        }
        // run through one step of a CPU fetch-decode-execute (FDE) cycle.
        cycle() {
            const opcode = this.fetch();
            const { instruction, args } = decode(opcode);
            this.execute(instruction, args);
        }
    }
    /**
     * @returns a freshly initialised CHIP8 CPU
     * Remember:
     * 1 word = 16 bits = 4 hex digits
     * 1 byte = 8 bits = 2 hex digits
     * 1 nibble = 4 bits = 1 hex digit
     */
    function createCpu(io = createMemoryIO()) {
        return new Cpu(io);
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
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
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    var CpuState;
    (function (CpuState) {
        CpuState["paused"] = "paused";
        CpuState["playing"] = "playing";
    })(CpuState || (CpuState = {}));
    const cpuState = writable(CpuState.playing);
    function createCpuStore() {
        let cpu = createCpu();
        let timerId = undefined;
        let currentRom;
        const { subscribe, set } = writable(cpu);
        return {
            subscribe,
            load: (rom) => {
                currentRom = rom;
                cpu.load(rom);
            },
            play: () => {
                cpuState.set(CpuState.playing);
                if (timerId)
                    clearInterval(timerId);
                timerId = setInterval(() => {
                    cpu.cycle();
                    set(cpu);
                }, 1);
            },
            stop: () => {
                cpuState.set(CpuState.paused);
                clearInterval(timerId);
            },
            step: () => {
                cpu.cycle();
                set(cpu);
            },
            reset: () => {
                cpu = createCpu();
                if (currentRom)
                    cpu.load(currentRom);
                set(cpu);
            },
        };
    }
    var store = {
        cpuStore: createCpuStore(),
        cpuState
    };

    /* src/Display.svelte generated by Svelte v3.42.6 */
    const file$4 = "src/Display.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let canvas_1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			canvas_1 = element("canvas");
    			attr_dev(canvas_1, "id", "canvasDisplay");
    			attr_dev(canvas_1, "width", /*WIDTH*/ ctx[1]);
    			attr_dev(canvas_1, "height", /*HEIGHT*/ ctx[2]);
    			attr_dev(canvas_1, "class", "svelte-1papd05");
    			add_location(canvas_1, file$4, 27, 2, 764);
    			set_style(div, "text-align", "center");
    			add_location(div, file$4, 26, 0, 729);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, canvas_1);
    			/*canvas_1_binding*/ ctx[4](canvas_1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*canvas_1_binding*/ ctx[4](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Display', slots, []);
    	let { pixels } = $$props;
    	let canvas;
    	let PIXEL_SIZE = 10;
    	let WIDTH = PIXEL_SIZE * 64;
    	let HEIGHT = PIXEL_SIZE * 32;

    	onMount(() => {
    		const ctx = canvas.getContext("2d");
    		ctx.fillStyle = "#7CFC00";
    		let frame = requestAnimationFrame(loop);

    		function loop() {
    			ctx.clearRect(0, 0, canvas.width, canvas.height);

    			pixels.forEach((row, y) => {
    				row.forEach((column, x) => {
    					if (column) ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    				});
    			});

    			frame = requestAnimationFrame(loop);
    		}

    		return () => {
    			cancelAnimationFrame(frame);
    		};
    	});

    	const writable_props = ['pixels'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Display> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvas = $$value;
    			$$invalidate(0, canvas);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('pixels' in $$props) $$invalidate(3, pixels = $$props.pixels);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		pixels,
    		canvas,
    		PIXEL_SIZE,
    		WIDTH,
    		HEIGHT
    	});

    	$$self.$inject_state = $$props => {
    		if ('pixels' in $$props) $$invalidate(3, pixels = $$props.pixels);
    		if ('canvas' in $$props) $$invalidate(0, canvas = $$props.canvas);
    		if ('PIXEL_SIZE' in $$props) PIXEL_SIZE = $$props.PIXEL_SIZE;
    		if ('WIDTH' in $$props) $$invalidate(1, WIDTH = $$props.WIDTH);
    		if ('HEIGHT' in $$props) $$invalidate(2, HEIGHT = $$props.HEIGHT);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [canvas, WIDTH, HEIGHT, pixels, canvas_1_binding];
    }

    class Display extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { pixels: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Display",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*pixels*/ ctx[3] === undefined && !('pixels' in props)) {
    			console.warn("<Display> was created without expected prop 'pixels'");
    		}
    	}

    	get pixels() {
    		throw new Error("<Display>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pixels(value) {
    		throw new Error("<Display>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    /**
     * lodash (Custom Build) <https://lodash.com/>
     * Build: `lodash modularize exports="npm" -o ./`
     * Copyright jQuery Foundation and other contributors <https://jquery.org/>
     * Released under MIT license <https://lodash.com/license>
     * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
     * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     */

    /** Used as the `TypeError` message for "Functions" methods. */
    var FUNC_ERROR_TEXT = 'Expected a function';

    /** Used as references for various `Number` constants. */
    var NAN = 0 / 0;

    /** `Object#toString` result references. */
    var symbolTag = '[object Symbol]';

    /** Used to match leading and trailing whitespace. */
    var reTrim = /^\s+|\s+$/g;

    /** Used to detect bad signed hexadecimal string values. */
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

    /** Used to detect binary string values. */
    var reIsBinary = /^0b[01]+$/i;

    /** Used to detect octal string values. */
    var reIsOctal = /^0o[0-7]+$/i;

    /** Built-in method references without a dependency on `root`. */
    var freeParseInt = parseInt;

    /** Detect free variable `global` from Node.js. */
    var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

    /** Detect free variable `self`. */
    var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

    /** Used as a reference to the global object. */
    var root = freeGlobal || freeSelf || Function('return this')();

    /** Used for built-in method references. */
    var objectProto = Object.prototype;

    /**
     * Used to resolve the
     * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
     * of values.
     */
    var objectToString = objectProto.toString;

    /* Built-in method references for those with the same name as other `lodash` methods. */
    var nativeMax = Math.max,
        nativeMin = Math.min;

    /**
     * Gets the timestamp of the number of milliseconds that have elapsed since
     * the Unix epoch (1 January 1970 00:00:00 UTC).
     *
     * @static
     * @memberOf _
     * @since 2.4.0
     * @category Date
     * @returns {number} Returns the timestamp.
     * @example
     *
     * _.defer(function(stamp) {
     *   console.log(_.now() - stamp);
     * }, _.now());
     * // => Logs the number of milliseconds it took for the deferred invocation.
     */
    var now = function() {
      return root.Date.now();
    };

    /**
     * Creates a debounced function that delays invoking `func` until after `wait`
     * milliseconds have elapsed since the last time the debounced function was
     * invoked. The debounced function comes with a `cancel` method to cancel
     * delayed `func` invocations and a `flush` method to immediately invoke them.
     * Provide `options` to indicate whether `func` should be invoked on the
     * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
     * with the last arguments provided to the debounced function. Subsequent
     * calls to the debounced function return the result of the last `func`
     * invocation.
     *
     * **Note:** If `leading` and `trailing` options are `true`, `func` is
     * invoked on the trailing edge of the timeout only if the debounced function
     * is invoked more than once during the `wait` timeout.
     *
     * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
     * until to the next tick, similar to `setTimeout` with a timeout of `0`.
     *
     * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
     * for details over the differences between `_.debounce` and `_.throttle`.
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Function
     * @param {Function} func The function to debounce.
     * @param {number} [wait=0] The number of milliseconds to delay.
     * @param {Object} [options={}] The options object.
     * @param {boolean} [options.leading=false]
     *  Specify invoking on the leading edge of the timeout.
     * @param {number} [options.maxWait]
     *  The maximum time `func` is allowed to be delayed before it's invoked.
     * @param {boolean} [options.trailing=true]
     *  Specify invoking on the trailing edge of the timeout.
     * @returns {Function} Returns the new debounced function.
     * @example
     *
     * // Avoid costly calculations while the window size is in flux.
     * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
     *
     * // Invoke `sendMail` when clicked, debouncing subsequent calls.
     * jQuery(element).on('click', _.debounce(sendMail, 300, {
     *   'leading': true,
     *   'trailing': false
     * }));
     *
     * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
     * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
     * var source = new EventSource('/stream');
     * jQuery(source).on('message', debounced);
     *
     * // Cancel the trailing debounced invocation.
     * jQuery(window).on('popstate', debounced.cancel);
     */
    function debounce(func, wait, options) {
      var lastArgs,
          lastThis,
          maxWait,
          result,
          timerId,
          lastCallTime,
          lastInvokeTime = 0,
          leading = false,
          maxing = false,
          trailing = true;

      if (typeof func != 'function') {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      wait = toNumber(wait) || 0;
      if (isObject(options)) {
        leading = !!options.leading;
        maxing = 'maxWait' in options;
        maxWait = maxing ? nativeMax(toNumber(options.maxWait) || 0, wait) : maxWait;
        trailing = 'trailing' in options ? !!options.trailing : trailing;
      }

      function invokeFunc(time) {
        var args = lastArgs,
            thisArg = lastThis;

        lastArgs = lastThis = undefined;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
      }

      function leadingEdge(time) {
        // Reset any `maxWait` timer.
        lastInvokeTime = time;
        // Start the timer for the trailing edge.
        timerId = setTimeout(timerExpired, wait);
        // Invoke the leading edge.
        return leading ? invokeFunc(time) : result;
      }

      function remainingWait(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime,
            result = wait - timeSinceLastCall;

        return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
      }

      function shouldInvoke(time) {
        var timeSinceLastCall = time - lastCallTime,
            timeSinceLastInvoke = time - lastInvokeTime;

        // Either this is the first call, activity has stopped and we're at the
        // trailing edge, the system time has gone backwards and we're treating
        // it as the trailing edge, or we've hit the `maxWait` limit.
        return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
          (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
      }

      function timerExpired() {
        var time = now();
        if (shouldInvoke(time)) {
          return trailingEdge(time);
        }
        // Restart the timer.
        timerId = setTimeout(timerExpired, remainingWait(time));
      }

      function trailingEdge(time) {
        timerId = undefined;

        // Only invoke if we have `lastArgs` which means `func` has been
        // debounced at least once.
        if (trailing && lastArgs) {
          return invokeFunc(time);
        }
        lastArgs = lastThis = undefined;
        return result;
      }

      function cancel() {
        if (timerId !== undefined) {
          clearTimeout(timerId);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timerId = undefined;
      }

      function flush() {
        return timerId === undefined ? result : trailingEdge(now());
      }

      function debounced() {
        var time = now(),
            isInvoking = shouldInvoke(time);

        lastArgs = arguments;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
          if (timerId === undefined) {
            return leadingEdge(lastCallTime);
          }
          if (maxing) {
            // Handle invocations in a tight loop.
            timerId = setTimeout(timerExpired, wait);
            return invokeFunc(lastCallTime);
          }
        }
        if (timerId === undefined) {
          timerId = setTimeout(timerExpired, wait);
        }
        return result;
      }
      debounced.cancel = cancel;
      debounced.flush = flush;
      return debounced;
    }

    /**
     * Checks if `value` is the
     * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
     * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
     *
     * @static
     * @memberOf _
     * @since 0.1.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.
     * @example
     *
     * _.isObject({});
     * // => true
     *
     * _.isObject([1, 2, 3]);
     * // => true
     *
     * _.isObject(_.noop);
     * // => true
     *
     * _.isObject(null);
     * // => false
     */
    function isObject(value) {
      var type = typeof value;
      return !!value && (type == 'object' || type == 'function');
    }

    /**
     * Checks if `value` is object-like. A value is object-like if it's not `null`
     * and has a `typeof` result of "object".
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
     * @example
     *
     * _.isObjectLike({});
     * // => true
     *
     * _.isObjectLike([1, 2, 3]);
     * // => true
     *
     * _.isObjectLike(_.noop);
     * // => false
     *
     * _.isObjectLike(null);
     * // => false
     */
    function isObjectLike(value) {
      return !!value && typeof value == 'object';
    }

    /**
     * Checks if `value` is classified as a `Symbol` primitive or object.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to check.
     * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
     * @example
     *
     * _.isSymbol(Symbol.iterator);
     * // => true
     *
     * _.isSymbol('abc');
     * // => false
     */
    function isSymbol(value) {
      return typeof value == 'symbol' ||
        (isObjectLike(value) && objectToString.call(value) == symbolTag);
    }

    /**
     * Converts `value` to a number.
     *
     * @static
     * @memberOf _
     * @since 4.0.0
     * @category Lang
     * @param {*} value The value to process.
     * @returns {number} Returns the number.
     * @example
     *
     * _.toNumber(3.2);
     * // => 3.2
     *
     * _.toNumber(Number.MIN_VALUE);
     * // => 5e-324
     *
     * _.toNumber(Infinity);
     * // => Infinity
     *
     * _.toNumber('3.2');
     * // => 3.2
     */
    function toNumber(value) {
      if (typeof value == 'number') {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject(value)) {
        var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
        value = isObject(other) ? (other + '') : other;
      }
      if (typeof value != 'string') {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, '');
      var isBinary = reIsBinary.test(value);
      return (isBinary || reIsOctal.test(value))
        ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
        : (reIsBadHex.test(value) ? NAN : +value);
    }

    var lodash_debounce = debounce;

    // position in this array relates to which CHIP8 key was pressed
    const keyLayout = [
        // row 1
        1, 2, 3, 'C',
        // row 2
        4, 5, 6, 'D',
        // row 3
        7, 8, 9, 'E',
        // row 4
        'A', 0, 'B', 'F'
    ];
    // this will map keyboard keys to the index above
    const keyMap = {
        // row 1
        1: keyLayout.indexOf(1),
        2: keyLayout.indexOf(2),
        3: keyLayout.indexOf(3),
        4: keyLayout.indexOf('C'),
        // row 2
        'q': keyLayout.indexOf(4),
        'w': keyLayout.indexOf(5),
        'e': keyLayout.indexOf(6),
        'r': keyLayout.indexOf('D'),
        // row 3
        'a': keyLayout.indexOf(7),
        's': keyLayout.indexOf(8),
        'd': keyLayout.indexOf(9),
        "f": keyLayout.indexOf('E'),
        // row 4
        'z': keyLayout.indexOf('A'),
        'x': keyLayout.indexOf(0),
        'c': keyLayout.indexOf('B'),
        'v': keyLayout.indexOf('F')
    };

    /* src/Controls.svelte generated by Svelte v3.42.6 */

    const { Object: Object_1 } = globals;
    const file$3 = "src/Controls.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[16] = i;
    	return child_ctx;
    }

    // (44:4) {#if (i + 1) % 4 === 0}
    function create_if_block(ctx) {
    	let br;

    	const block = {
    		c: function create() {
    			br = element("br");
    			add_location(br, file$3, 44, 6, 1368);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(44:4) {#if (i + 1) % 4 === 0}",
    		ctx
    	});

    	return block;
    }

    // (35:2) {#each keyLayout as key, i}
    function create_each_block$1(ctx) {
    	let button;
    	let kbd;
    	let t0_value = /*keyBoardKeys*/ ctx[1][/*i*/ ctx[16]] + "";
    	let t0;
    	let button_class_value;
    	let t1;
    	let if_block_anchor;
    	let mounted;
    	let dispose;

    	function touchstart_handler() {
    		return /*touchstart_handler*/ ctx[6](/*i*/ ctx[16]);
    	}

    	function touchend_handler() {
    		return /*touchend_handler*/ ctx[7](/*i*/ ctx[16]);
    	}

    	function mouseleave_handler() {
    		return /*mouseleave_handler*/ ctx[8](/*i*/ ctx[16]);
    	}

    	function mousedown_handler() {
    		return /*mousedown_handler*/ ctx[9](/*i*/ ctx[16]);
    	}

    	function mouseup_handler() {
    		return /*mouseup_handler*/ ctx[10](/*i*/ ctx[16]);
    	}

    	let if_block = (/*i*/ ctx[16] + 1) % 4 === 0 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			kbd = element("kbd");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(kbd, file$3, 41, 40, 1291);
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*io*/ ctx[0].isKeyDown(/*i*/ ctx[16]) ? "down" : "") + " svelte-163hapm"));
    			add_location(button, file$3, 35, 4, 1032);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, kbd);
    			append_dev(kbd, t0);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "touchstart", touchstart_handler, { passive: true }, false, false),
    					listen_dev(button, "touchend", touchend_handler, { passive: true }, false, false),
    					listen_dev(button, "mouseleave", mouseleave_handler, false, false, false),
    					listen_dev(button, "mousedown", mousedown_handler, false, false, false),
    					listen_dev(button, "mouseup", mouseup_handler, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*io*/ 1 && button_class_value !== (button_class_value = "" + (null_to_empty(/*io*/ ctx[0].isKeyDown(/*i*/ ctx[16]) ? "down" : "") + " svelte-163hapm"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(35:2) {#each keyLayout as key, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let mounted;
    	let dispose;
    	let each_value = keyLayout;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "id", "keypad");
    			add_location(div, file$3, 33, 0, 980);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "keyup", /*debouncedKeyUp*/ ctx[4], false, false, false),
    					listen_dev(window, "keydown", /*debouncedKeyDown*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*io, keyPressed, keyReleased, keyBoardKeys*/ 15) {
    				each_value = keyLayout;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots('Controls', slots, []);
    	let { io } = $$props;
    	const keyBoardKeys = Object.keys(keyMap);

    	function keyPressed(key) {
    		io.keyDown(key);
    	}

    	function keyReleased(key) {
    		io.keyUp(key);
    	}

    	function handleKeyUp(event) {
    		const key = keyMap[event.key];
    		if (key !== undefined) keyReleased(key);
    	}

    	function handleKeyDown(event) {
    		const key = keyMap[event.key];
    		if (key !== undefined && !io.isKeyDown(key)) keyPressed(key);
    	}

    	// debounce keypresses so that the function does not get
    	// called multiple times when the user holds a key down.
    	function createDebouncedKeypress(func) {
    		return lodash_debounce(func, 100, { leading: true, trailing: false });
    	}

    	const debouncedKeyUp = createDebouncedKeypress(handleKeyUp);
    	const debouncedKeyDown = createDebouncedKeypress(handleKeyDown);
    	const writable_props = ['io'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Controls> was created with unknown prop '${key}'`);
    	});

    	const touchstart_handler = i => keyPressed(i);
    	const touchend_handler = i => keyReleased(i);
    	const mouseleave_handler = i => keyReleased(i);
    	const mousedown_handler = i => keyPressed(i);
    	const mouseup_handler = i => keyReleased(i);

    	$$self.$$set = $$props => {
    		if ('io' in $$props) $$invalidate(0, io = $$props.io);
    	};

    	$$self.$capture_state = () => ({
    		io,
    		debounce: lodash_debounce,
    		keyLayout,
    		keyMap,
    		keyBoardKeys,
    		keyPressed,
    		keyReleased,
    		handleKeyUp,
    		handleKeyDown,
    		createDebouncedKeypress,
    		debouncedKeyUp,
    		debouncedKeyDown
    	});

    	$$self.$inject_state = $$props => {
    		if ('io' in $$props) $$invalidate(0, io = $$props.io);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		io,
    		keyBoardKeys,
    		keyPressed,
    		keyReleased,
    		debouncedKeyUp,
    		debouncedKeyDown,
    		touchstart_handler,
    		touchend_handler,
    		mouseleave_handler,
    		mousedown_handler,
    		mouseup_handler
    	];
    }

    class Controls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { io: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Controls",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*io*/ ctx[0] === undefined && !('io' in props)) {
    			console.warn("<Controls> was created without expected prop 'io'");
    		}
    	}

    	get io() {
    		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set io(value) {
    		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/CpuDetail.svelte generated by Svelte v3.42.6 */
    const file$2 = "src/CpuDetail.svelte";

    function create_fragment$2(ctx) {
    	let table;
    	let tr0;
    	let t1;
    	let tr1;
    	let th0;
    	let t3;
    	let td0;
    	let t4_value = /*$cpuStore*/ ctx[0].pc.toString(16) + "";
    	let t4;
    	let t5;
    	let tr2;
    	let th1;
    	let t7;
    	let td1;
    	let t8_value = /*$cpuStore*/ ctx[0].i.toString(16) + "";
    	let t8;
    	let t9;
    	let tr3;
    	let th2;
    	let t11;
    	let td2;
    	let t12_value = /*$cpuStore*/ ctx[0].sp.toString(16) + "";
    	let t12;
    	let t13;
    	let tr4;
    	let th3;
    	let td3;
    	let t15_value = /*$cpuStore*/ ctx[0].stack + "";
    	let t15;
    	let t16;
    	let tr5;
    	let th4;
    	let t18;
    	let td4;
    	let t19_value = /*$cpuStore*/ ctx[0].delayTimer + "";
    	let t19;
    	let t20;
    	let tr6;
    	let th5;
    	let t22;
    	let td5;
    	let t23_value = /*$cpuStore*/ ctx[0].soundTimer + "";
    	let t23;
    	let t24;
    	let tr7;
    	let th6;
    	let t26;
    	let td6;
    	let t27_value = ppInstruction$1(/*$cpuStore*/ ctx[0].memory[/*$cpuStore*/ ctx[0].pc]) + "";
    	let t27;
    	let t28;
    	let t29_value = ppInstruction$1(/*$cpuStore*/ ctx[0].memory[/*$cpuStore*/ ctx[0].pc + 1]) + "";
    	let t29;
    	let t30;
    	let tr8;
    	let th7;
    	let t32;
    	let td7;
    	let t33_value = /*$cpuStore*/ ctx[0].registers + "";
    	let t33;

    	const block = {
    		c: function create() {
    			table = element("table");
    			tr0 = element("tr");
    			tr0.textContent = "PC STATS";
    			t1 = space();
    			tr1 = element("tr");
    			th0 = element("th");
    			th0.textContent = "PC";
    			t3 = space();
    			td0 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			tr2 = element("tr");
    			th1 = element("th");
    			th1.textContent = "I";
    			t7 = space();
    			td1 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			tr3 = element("tr");
    			th2 = element("th");
    			th2.textContent = "Stack Pointer";
    			t11 = space();
    			td2 = element("td");
    			t12 = text(t12_value);
    			t13 = space();
    			tr4 = element("tr");
    			th3 = element("th");
    			th3.textContent = "Stack";
    			td3 = element("td");
    			t15 = text(t15_value);
    			t16 = space();
    			tr5 = element("tr");
    			th4 = element("th");
    			th4.textContent = "Delay Timer";
    			t18 = space();
    			td4 = element("td");
    			t19 = text(t19_value);
    			t20 = space();
    			tr6 = element("tr");
    			th5 = element("th");
    			th5.textContent = "Sound Timer";
    			t22 = space();
    			td5 = element("td");
    			t23 = text(t23_value);
    			t24 = space();
    			tr7 = element("tr");
    			th6 = element("th");
    			th6.textContent = "Instruction";
    			t26 = space();
    			td6 = element("td");
    			t27 = text(t27_value);
    			t28 = space();
    			t29 = text(t29_value);
    			t30 = space();
    			tr8 = element("tr");
    			th7 = element("th");
    			th7.textContent = "Registers";
    			t32 = space();
    			td7 = element("td");
    			t33 = text(t33_value);
    			add_location(tr0, file$2, 10, 2, 228);
    			attr_dev(th0, "class", "svelte-1m730fx");
    			add_location(th0, file$2, 12, 4, 257);
    			attr_dev(td0, "class", "svelte-1m730fx");
    			add_location(td0, file$2, 13, 4, 273);
    			add_location(tr1, file$2, 11, 2, 248);
    			attr_dev(th1, "class", "svelte-1m730fx");
    			add_location(th1, file$2, 16, 4, 329);
    			attr_dev(td1, "class", "svelte-1m730fx");
    			add_location(td1, file$2, 17, 4, 344);
    			add_location(tr2, file$2, 15, 2, 320);
    			attr_dev(th2, "class", "svelte-1m730fx");
    			add_location(th2, file$2, 20, 4, 399);
    			attr_dev(td2, "class", "svelte-1m730fx");
    			add_location(td2, file$2, 21, 4, 426);
    			add_location(tr3, file$2, 19, 2, 390);
    			attr_dev(th3, "class", "svelte-1m730fx");
    			add_location(th3, file$2, 24, 4, 482);
    			attr_dev(td3, "class", "svelte-1m730fx");
    			add_location(td3, file$2, 24, 18, 496);
    			add_location(tr4, file$2, 23, 2, 473);
    			attr_dev(th4, "class", "svelte-1m730fx");
    			add_location(th4, file$2, 27, 4, 543);
    			attr_dev(td4, "class", "svelte-1m730fx");
    			add_location(td4, file$2, 28, 4, 568);
    			add_location(tr5, file$2, 26, 2, 534);
    			attr_dev(th5, "class", "svelte-1m730fx");
    			add_location(th5, file$2, 33, 4, 631);
    			attr_dev(td5, "class", "svelte-1m730fx");
    			add_location(td5, file$2, 34, 4, 656);
    			add_location(tr6, file$2, 32, 2, 622);
    			attr_dev(th6, "class", "svelte-1m730fx");
    			add_location(th6, file$2, 37, 4, 708);
    			attr_dev(td6, "class", "svelte-1m730fx");
    			add_location(td6, file$2, 38, 4, 733);
    			add_location(tr7, file$2, 36, 2, 699);
    			attr_dev(th7, "class", "svelte-1m730fx");
    			add_location(th7, file$2, 44, 4, 879);
    			attr_dev(td7, "class", "svelte-1m730fx");
    			add_location(td7, file$2, 45, 4, 902);
    			add_location(tr8, file$2, 43, 2, 870);
    			add_location(table, file$2, 9, 0, 218);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, tr0);
    			append_dev(table, t1);
    			append_dev(table, tr1);
    			append_dev(tr1, th0);
    			append_dev(tr1, t3);
    			append_dev(tr1, td0);
    			append_dev(td0, t4);
    			append_dev(table, t5);
    			append_dev(table, tr2);
    			append_dev(tr2, th1);
    			append_dev(tr2, t7);
    			append_dev(tr2, td1);
    			append_dev(td1, t8);
    			append_dev(table, t9);
    			append_dev(table, tr3);
    			append_dev(tr3, th2);
    			append_dev(tr3, t11);
    			append_dev(tr3, td2);
    			append_dev(td2, t12);
    			append_dev(table, t13);
    			append_dev(table, tr4);
    			append_dev(tr4, th3);
    			append_dev(tr4, td3);
    			append_dev(td3, t15);
    			append_dev(table, t16);
    			append_dev(table, tr5);
    			append_dev(tr5, th4);
    			append_dev(tr5, t18);
    			append_dev(tr5, td4);
    			append_dev(td4, t19);
    			append_dev(table, t20);
    			append_dev(table, tr6);
    			append_dev(tr6, th5);
    			append_dev(tr6, t22);
    			append_dev(tr6, td5);
    			append_dev(td5, t23);
    			append_dev(table, t24);
    			append_dev(table, tr7);
    			append_dev(tr7, th6);
    			append_dev(tr7, t26);
    			append_dev(tr7, td6);
    			append_dev(td6, t27);
    			append_dev(td6, t28);
    			append_dev(td6, t29);
    			append_dev(table, t30);
    			append_dev(table, tr8);
    			append_dev(tr8, th7);
    			append_dev(tr8, t32);
    			append_dev(tr8, td7);
    			append_dev(td7, t33);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$cpuStore*/ 1 && t4_value !== (t4_value = /*$cpuStore*/ ctx[0].pc.toString(16) + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*$cpuStore*/ 1 && t8_value !== (t8_value = /*$cpuStore*/ ctx[0].i.toString(16) + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*$cpuStore*/ 1 && t12_value !== (t12_value = /*$cpuStore*/ ctx[0].sp.toString(16) + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*$cpuStore*/ 1 && t15_value !== (t15_value = /*$cpuStore*/ ctx[0].stack + "")) set_data_dev(t15, t15_value);
    			if (dirty & /*$cpuStore*/ 1 && t19_value !== (t19_value = /*$cpuStore*/ ctx[0].delayTimer + "")) set_data_dev(t19, t19_value);
    			if (dirty & /*$cpuStore*/ 1 && t23_value !== (t23_value = /*$cpuStore*/ ctx[0].soundTimer + "")) set_data_dev(t23, t23_value);
    			if (dirty & /*$cpuStore*/ 1 && t27_value !== (t27_value = ppInstruction$1(/*$cpuStore*/ ctx[0].memory[/*$cpuStore*/ ctx[0].pc]) + "")) set_data_dev(t27, t27_value);
    			if (dirty & /*$cpuStore*/ 1 && t29_value !== (t29_value = ppInstruction$1(/*$cpuStore*/ ctx[0].memory[/*$cpuStore*/ ctx[0].pc + 1]) + "")) set_data_dev(t29, t29_value);
    			if (dirty & /*$cpuStore*/ 1 && t33_value !== (t33_value = /*$cpuStore*/ ctx[0].registers + "")) set_data_dev(t33, t33_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
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

    function ppInstruction$1(num) {
    	var s = "00" + num.toString(16);
    	return s.substr(s.length - 2);
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $cpuStore;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CpuDetail', slots, []);
    	const { cpuStore } = store;
    	validate_store(cpuStore, 'cpuStore');
    	component_subscribe($$self, cpuStore, value => $$invalidate(0, $cpuStore = value));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CpuDetail> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		store,
    		cpuStore,
    		ppInstruction: ppInstruction$1,
    		$cpuStore
    	});

    	return [$cpuStore, cpuStore];
    }

    class CpuDetail extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CpuDetail",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Chip8.svelte generated by Svelte v3.42.6 */
    const file$1 = "src/Chip8.svelte";

    function create_fragment$1(ctx) {
    	let div2;
    	let div0;
    	let display;
    	let t0;
    	let div1;
    	let section0;
    	let controls;
    	let t1;
    	let section1;
    	let cpudetail;
    	let current;

    	display = new Display({
    			props: { pixels: /*$cpuStore*/ ctx[0].io.display },
    			$$inline: true
    		});

    	controls = new Controls({
    			props: { io: /*$cpuStore*/ ctx[0].io },
    			$$inline: true
    		});

    	cpudetail = new CpuDetail({ $$inline: true });

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			create_component(display.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			section0 = element("section");
    			create_component(controls.$$.fragment);
    			t1 = space();
    			section1 = element("section");
    			create_component(cpudetail.$$.fragment);
    			add_location(div0, file$1, 13, 2, 362);
    			attr_dev(section0, "id", "keypad");
    			attr_dev(section0, "class", "svelte-y7wxfa");
    			add_location(section0, file$1, 18, 4, 436);
    			attr_dev(section1, "id", "detail");
    			attr_dev(section1, "class", "svelte-y7wxfa");
    			add_location(section1, file$1, 21, 4, 514);
    			add_location(div1, file$1, 17, 2, 426);
    			add_location(div2, file$1, 12, 0, 354);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			mount_component(display, div0, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, section0);
    			mount_component(controls, section0, null);
    			append_dev(div1, t1);
    			append_dev(div1, section1);
    			mount_component(cpudetail, section1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const display_changes = {};
    			if (dirty & /*$cpuStore*/ 1) display_changes.pixels = /*$cpuStore*/ ctx[0].io.display;
    			display.$set(display_changes);
    			const controls_changes = {};
    			if (dirty & /*$cpuStore*/ 1) controls_changes.io = /*$cpuStore*/ ctx[0].io;
    			controls.$set(controls_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(display.$$.fragment, local);
    			transition_in(controls.$$.fragment, local);
    			transition_in(cpudetail.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(display.$$.fragment, local);
    			transition_out(controls.$$.fragment, local);
    			transition_out(cpudetail.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_component(display);
    			destroy_component(controls);
    			destroy_component(cpudetail);
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

    function ppInstruction(num) {
    	var s = "00" + num.toString(16);
    	return s.substr(s.length - 2);
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $cpuStore;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Chip8', slots, []);
    	const { cpuStore, cpuState } = store;
    	validate_store(cpuStore, 'cpuStore');
    	component_subscribe($$self, cpuStore, value => $$invalidate(0, $cpuStore = value));
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Chip8> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		store,
    		Display,
    		Controls,
    		CpuDetail,
    		cpuStore,
    		cpuState,
    		ppInstruction,
    		$cpuStore
    	});

    	return [$cpuStore, cpuStore];
    }

    class Chip8 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Chip8",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.42.6 */
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (52:8) {#each romLocations as romLocation}
    function create_each_block(ctx) {
    	let option;
    	let t0_value = /*romLocation*/ ctx[10].name + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = /*romLocation*/ ctx[10].location;
    			option.value = option.__value;
    			add_location(option, file, 52, 10, 2048);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(52:8) {#each romLocations as romLocation}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div2;
    	let div0;
    	let label;
    	let t1;
    	let select_1;
    	let t2;
    	let div1;
    	let button0;
    	let span0;
    	let t3;
    	let span1;
    	let button0_disabled_value;
    	let t5;
    	let button1;
    	let span2;
    	let t6;
    	let span3;
    	let t8;
    	let button2;
    	let span4;
    	let t9;
    	let span5;
    	let t11;
    	let button3;
    	let span6;
    	let t12;
    	let span7;
    	let t14;
    	let chip8;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*romLocations*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	chip8 = new Chip8({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			div0 = element("div");
    			label = element("label");
    			label.textContent = "Select ????";
    			t1 = space();
    			select_1 = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			div1 = element("div");
    			button0 = element("button");
    			span0 = element("span");
    			t3 = space();
    			span1 = element("span");
    			span1.textContent = "1";
    			t5 = space();
    			button1 = element("button");
    			span2 = element("span");
    			t6 = space();
    			span3 = element("span");
    			span3.textContent = "2";
    			t8 = space();
    			button2 = element("button");
    			span4 = element("span");
    			t9 = space();
    			span5 = element("span");
    			span5.textContent = "3";
    			t11 = space();
    			button3 = element("button");
    			span6 = element("span");
    			t12 = space();
    			span7 = element("span");
    			span7.textContent = "4";
    			t14 = space();
    			create_component(chip8.$$.fragment);
    			attr_dev(label, "for", "romSelector");
    			add_location(label, file, 44, 6, 1805);
    			attr_dev(select_1, "id", "romSelector");
    			if (/*selectedRomLocation*/ ctx[1] === void 0) add_render_callback(() => /*select_1_change_handler*/ ctx[7].call(select_1));
    			add_location(select_1, file, 45, 6, 1856);
    			attr_dev(div0, "id", "rom-controls");
    			add_location(div0, file, 43, 4, 1775);
    			attr_dev(span0, "class", "material-icons");
    			attr_dev(span0, "title", "Step");
    			add_location(span0, file, 60, 9, 2291);
    			attr_dev(span1, "class", "buttonText");
    			add_location(span1, file, 61, 8, 2349);
    			button0.disabled = button0_disabled_value = /*$cpuState*/ ctx[2] === "playing";
    			add_location(button0, file, 59, 6, 2214);
    			attr_dev(span2, "class", "material-icons");
    			attr_dev(span2, "title", "Play");
    			add_location(span2, file, 64, 9, 2486);
    			attr_dev(span3, "class", "buttonText");
    			add_location(span3, file, 65, 8, 2544);
    			toggle_class(button1, "active", /*$cpuState*/ ctx[2] === "playing");
    			add_location(button1, file, 63, 6, 2405);
    			attr_dev(span4, "class", "material-icons");
    			attr_dev(span4, "title", "Pause");
    			add_location(span4, file, 68, 9, 2680);
    			attr_dev(span5, "class", "buttonText");
    			add_location(span5, file, 69, 8, 2739);
    			toggle_class(button2, "active", /*$cpuState*/ ctx[2] === "paused");
    			add_location(button2, file, 67, 6, 2600);
    			attr_dev(span6, "class", "material-icons");
    			attr_dev(span6, "title", "Reset");
    			add_location(span6, file, 72, 9, 2838);
    			attr_dev(span7, "class", "buttonText");
    			add_location(span7, file, 73, 8, 2897);
    			add_location(button3, file, 71, 6, 2795);
    			attr_dev(div1, "id", "cpu-controls");
    			add_location(div1, file, 58, 4, 2184);
    			attr_dev(div2, "id", "content");
    			attr_dev(div2, "class", "svelte-wqzbl8");
    			add_location(div2, file, 42, 2, 1752);
    			attr_dev(main, "class", "svelte-wqzbl8");
    			add_location(main, file, 41, 0, 1743);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			append_dev(div2, div0);
    			append_dev(div0, label);
    			append_dev(div0, t1);
    			append_dev(div0, select_1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select_1, null);
    			}

    			select_option(select_1, /*selectedRomLocation*/ ctx[1]);
    			/*select_1_binding*/ ctx[8](select_1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			append_dev(button0, span0);
    			append_dev(button0, t3);
    			append_dev(button0, span1);
    			append_dev(div1, t5);
    			append_dev(div1, button1);
    			append_dev(button1, span2);
    			append_dev(button1, t6);
    			append_dev(button1, span3);
    			append_dev(div1, t8);
    			append_dev(div1, button2);
    			append_dev(button2, span4);
    			append_dev(button2, t9);
    			append_dev(button2, span5);
    			append_dev(div1, t11);
    			append_dev(div1, button3);
    			append_dev(button3, span6);
    			append_dev(button3, t12);
    			append_dev(button3, span7);
    			append_dev(div2, t14);
    			mount_component(chip8, div2, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select_1, "change", /*select_1_change_handler*/ ctx[7]),
    					listen_dev(select_1, "change", /*fetchRom*/ ctx[6], false, false, false),
    					listen_dev(button0, "click", /*cpuStore*/ ctx[3].step, false, false, false),
    					listen_dev(button1, "click", /*cpuStore*/ ctx[3].play, false, false, false),
    					listen_dev(button2, "click", /*cpuStore*/ ctx[3].stop, false, false, false),
    					listen_dev(button3, "click", /*cpuStore*/ ctx[3].reset, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*romLocations*/ 32) {
    				each_value = /*romLocations*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select_1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*selectedRomLocation*/ 2) {
    				select_option(select_1, /*selectedRomLocation*/ ctx[1]);
    			}

    			if (!current || dirty & /*$cpuState*/ 4 && button0_disabled_value !== (button0_disabled_value = /*$cpuState*/ ctx[2] === "playing")) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*$cpuState*/ 4) {
    				toggle_class(button1, "active", /*$cpuState*/ ctx[2] === "playing");
    			}

    			if (dirty & /*$cpuState*/ 4) {
    				toggle_class(button2, "active", /*$cpuState*/ ctx[2] === "paused");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(chip8.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(chip8.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			/*select_1_binding*/ ctx[8](null);
    			destroy_component(chip8);
    			mounted = false;
    			run_all(dispose);
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
    	let $cpuState;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	const { cpuStore, cpuState } = store;
    	validate_store(cpuState, 'cpuState');
    	component_subscribe($$self, cpuState, value => $$invalidate(2, $cpuState = value));

    	const romLocations = [
    		{ name: "Maze", location: "/roms/Maze.ch8" },
    		{
    			name: "Invaders",
    			location: "/roms/Invaders.ch8"
    		},
    		{
    			name: "Tic Tac Toe",
    			location: "/roms/TicTacToe.ch8"
    		},
    		{ name: "Wall", location: "/roms/Wall.ch8" }
    	];

    	let select;
    	let selectedRomLocation = romLocations[0].location;

    	function fetchRom() {
    		return __awaiter(this, void 0, void 0, function* () {
    			if (!selectedRomLocation) return;

    			return fetch(selectedRomLocation).then(r => r.arrayBuffer()).then(data => new Uint8Array(data)).then(rom => {
    				// The blur here unfocuses the select input so that the first keypress
    				// doesn't change the value of it.
    				select.blur();

    				cpuStore.load(rom);
    				cpuStore.reset();
    				cpuStore.play();
    			});
    		});
    	}

    	onMount(fetchRom);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function select_1_change_handler() {
    		selectedRomLocation = select_value(this);
    		$$invalidate(1, selectedRomLocation);
    	}

    	function select_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			select = $$value;
    			$$invalidate(0, select);
    			$$invalidate(5, romLocations);
    		});
    	}

    	$$self.$capture_state = () => ({
    		__awaiter,
    		onMount,
    		Chip8,
    		store,
    		cpuStore,
    		cpuState,
    		romLocations,
    		select,
    		selectedRomLocation,
    		fetchRom,
    		$cpuState
    	});

    	$$self.$inject_state = $$props => {
    		if ('__awaiter' in $$props) __awaiter = $$props.__awaiter;
    		if ('select' in $$props) $$invalidate(0, select = $$props.select);
    		if ('selectedRomLocation' in $$props) $$invalidate(1, selectedRomLocation = $$props.selectedRomLocation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		select,
    		selectedRomLocation,
    		$cpuState,
    		cpuStore,
    		cpuState,
    		romLocations,
    		fetchRom,
    		select_1_change_handler,
    		select_1_binding
    	];
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
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
