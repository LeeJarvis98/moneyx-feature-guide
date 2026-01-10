const {createApp,reactive} = Vue;

createApp({
  setup() {
    const items = reactive([
      {id: 0, pos: 0, url: 'https://tinyurl.com/4e6sb4eu'},
      {id: 1, pos: 1, url: 'https://tinyurl.com/2mj4ybmz'},
      {id: 2, pos: 2, url: 'https://tinyurl.com/y75eb7sx'},
      {id: 3, pos: 3, url: 'https://tinyurl.com/363twa27'},
      {id: 4, pos: 4, url: 'https://tinyurl.com/3cksf5nf'},
    ]);

    function shuffle(item) {
      const heroPos = Math.floor(items.length/2);
      const hero = items.findIndex(({pos}) => pos === heroPos);
      const target = items.findIndex(({id}) => id === item.id);
      [items[target].pos,items[hero].pos] = [items[hero].pos,items[target].pos];
    }

    return {
      items,
      shuffle,
    }
  },
}).mount('#app');