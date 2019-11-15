;(function () {
    'use strict';

    let Event = new Vue();     // 事件调度器

    let alert_sound = document.getElementById('alert-sound');

    // Object.assign() 方法用于将所有可枚举属性的值从一个或多个源对象复制到目标对象。它将返回目标对象。
    function copy(obj) {
        return Object.assign({}, obj);
    }

    // 未完成列表子级组件
    Vue.component('task', {
        template: '#task-tpl',
        props: ['todo'],
        methods: {
            action(name, params) {
                Event.$emit(name, params);
            }
        }
    });

    // 已完成列表子级组件
    Vue.component('tasked', {
        template: '#tasked-tpl',
        props: ['todo'],
        methods: {
            action(name, params) {
                Event.$emit(name, params);
            }
        }
    });

    new Vue({
        el: '#main',
        data: {
            list: [],      // 任务列表
            last_id: 0,    // 初始id为0
            current: {     // 输入记录
                title: '',
                completed: false,
                desc: '',
                alert_at: '',
                alert_confirmed: '',
                show_detail: '',
            }
        },

        mounted: function () {
            this.list = ms.get('list') || this.list;
            this.last_id = ms.get('last_id') || this.last_id;

            let _this = this;
            Event.$on('remove', function (id) {
                if (id) {
                    _this.remove(id);
                }
            });
            Event.$on('toggle_complete', function (id) {
                if (id) {
                    _this.toggle_complete(id);
                }
            });
            Event.$on('set_current', function (params) {
                if (params) {
                    _this.set_current(params);
                }
            });
            Event.$on('toggle_detail', function (id) {
                if (id) {
                    _this.toggle_detail(id);
                }
            });

            // 每1s检测一次是否有提醒任务
            setInterval(function () {
                _this.check_alerts();
            }, 1000)
        },

        methods: {
            // 提交表单
            merge() {
                // 判断input内容是否有id
                let is_update, id;
                is_update = id = this.current.id;
                if (!is_update) {
                    // 无id为添加一条记录
                    let title = this.current.title;
                    if (!title && title !== 0) return;   // 若输入为空
                    let todo = copy(this.current);
                    this.last_id++;                      // id自增1
                    ms.set('last_id', this.last_id);     // id存入localStorage
                    todo.id = this.last_id;              // 取出id为新添加记录id
                    this.list.push(todo);
                } else {
                    // 有id为更新当前记录
                    let index = this.find_index(id);
                    // this.list[index] = copy(this.current);
                    Vue.set(this.list, index, copy(this.current));   // Vue.set 数组元素的修改方法
                    // console.log('list:', this.list);
                    // console.log('index:', this.list[index]);
                }
                // ms.set('list', this.list);
                this.reset_current();
            },

            // 点击删除
            remove(id) {
                let index = this.find_index(id);
                this.list.splice(index, 1);
                // ms.set('list', this.list);
            },

            // 点击更新
            set_current(todo) {
                this.current = copy(todo);
            },

            // 清空input
            reset_current() {
                this.set_current({});
            },

            // 通过id找到索引
            find_index(id) {
                return this.list.findIndex(function (item) {
                    return item.id === id;
                })
            },

            // 标记是否已完成
            toggle_complete(id) {
                let index = this.find_index(id);
                // this.list[i].completed = !this.list[i].completed
                Vue.set(this.list[index], 'completed', !this.list[index].completed);
            },

            // 判断是否有需提醒的任务
            check_alerts() {
                let _this = this;
                this.list.forEach(function (row, i) {
                    let alert_at = row.alert_at;
                    if (!alert_at || row.alert_confirmed) return;
                    // console.log('alert_at:', alert_at);
                    alert_at = (new Date(alert_at)).getTime();   // 获取提醒时间的时间戳
                    let now = (new Date()).getTime();            // 获取当前时间的时间戳
                    if (now >= alert_at) {
                        alert_sound.play();
                        let confirmed = confirm(row.title + '时间到');
                        Vue.set(_this.list[i], 'alert_confirmed', confirmed);
                    }
                })
            },

            // 是否显示详情
            toggle_detail(id) {
                let index = this.find_index(id);
                Vue.set(this.list[index], 'show_detail', !this.list[index].show_detail)
            },
        },

        watch: {
            list: {
                deep: true,
                handler(new_val, old_val) {
                    if (new_val) {
                        ms.set('list', new_val);
                    } else {
                        ms.set('list', [])
                    }
                }
            }
        }
    });
})();
