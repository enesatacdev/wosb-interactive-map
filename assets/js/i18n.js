/**
 * i18n.js - Çoklu Dil Desteği (Internationalization)
 *
 * Kullanım:
 * - HTML'de: <span data-i18n="sidebar.ports">Limanlar</span>
 * - JS'de:   i18n.t('sidebar.ports') → "Limanlar" veya "Ports"
 * - Dil değişimi: i18n.setLanguage('en')
 *
 * Çeviriler inline olarak gömülüdür (file:// CORS sorunu çözümü).
 * Yeni dil eklemek için: LANG_DATA objesine yeni key ekleyin.
 */

const i18n = (() => {
  // Tüm dil verileri inline (CORS-immune)
  const LANG_DATA = {
    tr: {
      app: { title: "World of Sea Battle - Interactive Map" },
      sidebar: {
        brand: "World of Sea Battle",
        subtitle: "Interactive Map by Vurkaçoğlu",
        windcontrol: "Rüzgar Kontrolü",
        date: "Tarih",
        time: "Saat",
        winddirection: "Rüzgar Yönü",
        maplayers: "Harita",
        ports: "Limanlar",
        lighthouses: "Fenerler",
        fasttravel: "Hızlı Seyahat",
        islands: "Kişisel Adalar",
        production: "Üretim Alanları",
        altars: "Sunaklar",
        forts: "Kaleler",
        pvpborder: "PvP Sınırı",
        windlayer: "Rüzgar Çizgileri",
        language: "Dil",
        drawtools: "Çizim Araçları",
        portsettings: "Limanlar",
        precision: "Hassas Açı Ayarı",
        tooltips: {
          windprev: "Sola Döndür (-11.25°)",
          windsync: "Şu ana eşitle / Sync to Now",
          windnext: "Sağa Döndür (+11.25°)",
          windreset: "Manuel ayarları sıfırla / Fabrika değerlerine dön"
        }
      },
      products: {
        pineapples: "Ananas", vanilla: "Vanilya", wine: "Şarap", grog: "Grog",
        rugs: "Halı", leather: "Deri", cinnamon: "Tarçın", coffee: "Kahve",
        mango: "Mango", oil: "Yağ", nuts: "Fındık", paprika: "Biber",
        pepper: "Karabiber", beer: "Bira", sugar: "Şeker", salt: "Tuz",
        tobacco: "Tütün", dates: "Hurma", saffron: "Safran", silk: "İpek"
      },
      trade: {
        title: "Ticaret Fiyatları",
        product: "Ürün",
        price: "Fiyat",
        nodata: "Bu limanda ticaret verisi yok"
      },
      tradesys: {
        togglebtn: "Ticaret Önerileri",
        title: "Ticaret Önerileri",
        subtitle: "En karlı rotaları keşfedin",
        from: "Nereden (Alış)",
        to: "Nereye (Satış)",
        allports: "Tüm Limanlar",
        calculate: "Rotaları Bul",
        showingresults: "En iyi rotalar (Verimliliğe göre)",
        emptystate: "Seçim yapıp rotaları bulun",
        noprofit: "Bu kriterlerde karlı bir rota bulunamadı.",
        profit: "Kar",
        perweight: "Ağırlık Başı",
        buy: "Alış",
        sell: "Satış",
        sortby: "Sıralama",
        sortprofit: "Toplam Kar",
        sortefficiency: "Verimlilik (Altın/Mesafe)",
        sortdistance: "En Yakın Mesafe",
        includepvp: "PvP Alanını Dahil Et",
        distance: "Mesafe",
        pvpwarning: "⚔️ PvP Alanından Geçer",
        clearroute: "Rotayı Temizle",
        sortweightprofit: "Ağırlık Başı Kar",
        perweightunit: "/ wt",
        cargocapacity: "Gemi Kapasitesi",
        totalprofit: "Toplam Kar"
      },
      tooltip: {
        port: "Liman",
        clickfordetails: "Detaylar için tıklayın",
        nodata: "Veri bulunamadı"
      },
      regionalpoints: {
        title: "Bölgesel Puanlar",
        listtitle: "Bölgesel Kaynak Listesi",
        goto: "Haritada Göster",
        tooltip: {
          name: "İSİM:",
          resource: "KAYNAK:",
          detail: "DETAY:"
        },
        resources: {
          all: "Tümü",
          volcanicore: "Volkanik Kaya",
          chestkey: "Sandık Anahtarı",
          chest: "Sandık",
          voodooskull: "Voodoo Kafatası",
          insurance: "Sigorta",
          battlemark: "Savaş Markı",
          heavyshot: "Ağır Gülle",
          saxonshot: "Sakson Gülle",
          fish: "Balık",
          gold: "Altın",
          coin: "Gümüş"
        },
        unit: "Adet"
      },
      portsettings: {
        title: "Liman Ayarları",
        owner: "Kime Ait",
        clan: "Klan",
        warhours: "Savaş Saatleri",
        ownerplaceholder: "Oyuncu adı...",
        clanplaceholder: "Klan etiketi...",
        warplaceholder: "Örn: 20:00 - 21:00",
        iconselect: "İkon Seçimi",
        iconscale: "İkon Boyutu",
        labelsize: "İsim Boyutu",
        showicon: "İkonu Göster",
        showlabel: "İsmi Göster",
        icons: { k: "Küçük", n: "Tarafsız", f: "Kale", p: "Korsan" }
      },
      draw: {
        title: "Çizim & Planlama",
        close: "Kapat",
        sectiontools: "Araçlar",
        sectionoutline: "Çizgi (Outline)",
        sectionfill: "Dolgu (Fill)",
        sectionicons: "İkon Seçici",
        sectionroute: "Rota Bilgisi",
        sectionlayers: "Katmanlar / Çizimler",
        outlinesize: "Çizgi Kalınlığı",
        opacity: "Şeffaflık",
        distance: "Mesafe",
        time: "Süre",
        routecount: "Rota Sayısı",
        hint: "💡 Basılı tutup çiz · Bırakınca tamamlanır",
        undo: "Geri Al",
        clearall: "Hepsini Sil",
        clearroutes: "Rotaları Temizle",
        nodrawings: "Henüz çizim yok",
        contextmenu: {
          title: "Seçim Ayarı",
          outline: "Çizgi:",
          fill: "Dolgu:",
          move: "Taşı",
          delete: "Sil"
        },
        iconlabels: {
          anchor: "Çapa", ship: "Gemi", battle: "Savaş", pirate: "Korsan",
          danger: "Tehlike", warning: "Uyarı", defense: "Savunma", fire: "Ateş",
          bomb: "Bomba", castle: "Kale", mark: "İşaret", star: "Yıldız",
          flag: "Bayrak", sword: "Kılıç", target: "Hedef", treasure: "Hazine"
        },
        tools: {
          select: "Seç", pen: "Kalem", line: "Çizgi", rect: "Dikdörtgen",
          circle: "Daire", polygon: "Poligon", area: "Alan", text: "Yazı",
          eraser: "Silgi", route: "Rota", icon: "İkon", p2proute: "P2P Rota", ping: "Ping"
        }
      },
      wind: {
        compass: {
          n: "K", nne: "KKD", ne: "KD", ene: "DKD", e: "D", ese: "DGD", se: "GD", sse: "GGD",
          s: "G", ssw: "GGB", sw: "GB", wsw: "BGB", w: "B", wnw: "BBB", nw: "BB", nnw: "KBB"
        }
      },
      ports: {
        types: {
          small: "Küçük Liman", neutral: "Tarafsız Liman", faction: "Kale Limanı",
          pirate: "Korsan Limanı", unknown: "Liman"
        },
        tooltip: { owner: "SAHİBİ:", clan: "KLAN:", war: "SAVAŞ S." },
        status: { safe: "GÜVENLİ", active: "SAVAŞ AKTİF", startsin: "BAŞLIYOR" }
      },
      production: {
        resources: {
          demir: "Demir", kereste: "Kereste", deri: "Deri", gumush: "Gümüş",
          ipek: "İpek", kenevir: "Kenevir", kumash: "Kumaş", tutun: "Tütün", boya: "Boya",
          resin: "Reçine", su: "Su", rum: "Rum", komur: "Kömür", bakir: "Bakır", ciftlik: "Çiftlik"
        }
      },
      tradeunits: { nm: "nm", min: "dk" },
      visitor: {
        count: "Ziyaretçi Sayısı",
        buyrum: "Bana Rom Ismarla 🏴‍☠️"
      }
    },
    en: {
      app: { title: "World of Sea Battle - Interactive Map" },
      sidebar: {
        brand: "World of Sea Battle",
        subtitle: "Interactive Map by Vurkaçoğlu",
        windcontrol: "Wind Control",
        date: "Date",
        time: "Time",
        winddirection: "Wind Direction",
        maplayers: "Map",
        ports: "Ports",
        lighthouses: "Lighthouses",
        fasttravel: "Fast Travel",
        islands: "Personal Islands",
        production: "Production Sites",
        altars: "Altars",
        forts: "Forts",
        pvpborder: "PvP Border",
        windlayer: "Wind Flow",
        language: "Language",
        drawtools: "Drawing Tools",
        portsettings: "Ports",
        precision: "Precision Range",
        tooltips: {
          windprev: "Rotate Left (-11.25°)",
          windsync: "Sync to current time",
          windnext: "Rotate Right (+11.25°)",
          windreset: "Reset manual settings / Back to factory"
        }
      },
      products: {
        pineapples: "Pineapples", vanilla: "Vanilla", wine: "Wine", grog: "Grog",
        rugs: "Rugs", leather: "Leather", cinnamon: "Cinnamon", coffee: "Coffee",
        mango: "Mango", oil: "Oil", nuts: "Nuts", paprika: "Paprika",
        pepper: "Pepper", beer: "Beer", sugar: "Sugar", salt: "Salt",
        tobacco: "Tobacco", dates: "Dates", saffron: "Saffron", silk: "Silk"
      },
      trade: {
        title: "Trade Prices",
        product: "Product",
        price: "Price",
        nodata: "No trade data for this port"
      },
      tradesys: {
        togglebtn: "Trade Routes",
        title: "Trade Recommendations",
        subtitle: "Discover the most profitable routes",
        from: "From (Buy)",
        to: "To (Sell)",
        allports: "All Ports",
        calculate: "Find Routes",
        showingresults: "Best routes (By Efficiency)",
        emptystate: "Select ports to find routes",
        noprofit: "No profitable routes found with these criteria.",
        profit: "Profit",
        perweight: "Per Unit Weight",
        buy: "Buy",
        sell: "Sell",
        sortby: "Sort By",
        sortprofit: "Total Profit",
        sortefficiency: "Efficiency (Gold/Dist)",
        sortdistance: "Shortest Distance",
        includepvp: "Include PvP Area",
        distance: "Distance",
        pvpwarning: "⚔️ Passes through PvP",
        clearroute: "Clear Route",
        sortweightprofit: "Profit per Weight",
        perweightunit: "/ wt",
        cargocapacity: "Ship Capacity",
        totalprofit: "Total Profit"
      },
      tooltip: {
        port: "Port",
        clickfordetails: "Click for details",
        nodata: "No data found"
      },
      regionalpoints: {
        title: "Regional Points",
        listtitle: "Regional Resource List",
        goto: "Show on Map",
        tooltip: {
          name: "NAME:",
          resource: "RESOURCE:",
          detail: "DETAIL:"
        },
        resources: {
          all: "All",
          volcanicore: "Volcanic Ore",
          chestkey: "Chest Key",
          chest: "Chest",
          voodooskull: "Voodoo Skull",
          insurance: "Insurance",
          battlemark: "Battlemark",
          heavyshot: "Heavy Shot",
          saxonshot: "Saxon Shot",
          fish: "Fish",
          gold: "Gold",
          coin: "Coin"
        },
        unit: "Units"
      },
      portsettings: {
        title: "Port Settings",
        owner: "Owner",
        clan: "Clan",
        warhours: "War Times",
        ownerplaceholder: "Player name...",
        clanplaceholder: "Clan tag...",
        warplaceholder: "Ex: 20:00 - 21:00",
        iconselect: "Icon Selection",
        iconscale: "Icon Scale",
        labelsize: "Label Size",
        showicon: "Show Icon",
        showlabel: "Show Label",
        icons: { k: "Small", n: "Neutral", f: "Fort", p: "Pirate" }
      },
      draw: {
        title: "Drawing & Planning",
        close: "Close",
        sectiontools: "Tools",
        sectionoutline: "Outline",
        sectionfill: "Fill",
        sectionicons: "Icon Picker",
        sectionroute: "Route Information",
        sectionlayers: "Layers / Drawings",
        outlinesize: "Line Thickness",
        opacity: "Opacity",
        distance: "Distance",
        time: "Time",
        routecount: "Routes",
        hint: "💡 Hold to draw · Release to finish",
        undo: "Undo",
        clearall: "Clear All",
        clearroutes: "Clear Routes",
        nodrawings: "No drawings yet",
        contextmenu: {
          title: "Selection Settings",
          outline: "Outline:",
          fill: "Fill:",
          move: "Move",
          delete: "Delete"
        },
        iconlabels: {
          anchor: "Anchor", ship: "Ship", battle: "Battle", pirate: "Pirate",
          danger: "Danger", warning: "Warning", defense: "Defense", fire: "Fire",
          bomb: "Bomb", castle: "Castle", mark: "Mark", star: "Star",
          flag: "Flag", sword: "Sword", target: "Target", treasure: "Treasure"
        },
        tools: {
          select: "Select", pen: "Pen", line: "Line", rect: "Rect",
          circle: "Circle", polygon: "Polygon", area: "Area", text: "Text",
          eraser: "Eraser", route: "Route", icon: "Icon", p2proute: "P2P Route", ping: "Ping"
        }
      },
      wind: {
        compass: {
          n: "N", nne: "NNE", ne: "NE", ene: "ENE", e: "E", ese: "ESE", se: "SE", sse: "SSE",
          s: "S", ssw: "SSW", sw: "SW", wsw: "WSW", w: "W", wnw: "WNW", nw: "NW", nnw: "NNW"
        }
      },
      ports: {
        types: {
          small: "Small Port", neutral: "Neutral Port", faction: "Fort Port",
          pirate: "Pirate Port", unknown: "Port"
        },
        tooltip: { owner: "OWNER:", clan: "CLAN:", war: "WAR:" },
        status: { safe: "SAFE", active: "WAR ACTIVE", startsin: "STARTS IN" }
      },
      production: {
        resources: {
          demir: "Iron", kereste: "Timber", deri: "Leather", gumush: "Silver",
          ipek: "Silk", kenevir: "Hemp", kumash: "Cloth", tutun: "Tobacco", boya: "Dye",
          resin: "Resin", su: "Water", rum: "Rum", komur: "Coal", bakir: "Copper", ciftlik: "Farm"
        }
      },
      tradeunits: { nm: "nm", min: "min" },
      visitor: {
        count: "Visitor Count",
        buyrum: "Buy me a Rum 🏴‍☠️"
      }
    },
    ru: {
      app: { title: "World of Sea Battle - Интерактивная карта" },
      sidebar: {
        brand: "World of Sea Battle",
        subtitle: "Интерактивная карта от Vurkaçoğlu",
        windcontrol: "Управление ветром",
        date: "Дата",
        time: "Время",
        winddirection: "Направление ветра",
        maplayers: "Карта",
        ports: "Порты",
        lighthouses: "Маяки",
        fasttravel: "Быстрое перемещение",
        islands: "Личные острова",
        production: "Производственные зоны",
        altars: "Алтари",
        forts: "Форты",
        pvpborder: "Граница PvP",
        windlayer: "Потоки ветра",
        language: "Язык",
        drawtools: "Инструменты рисования",
        portsettings: "Порты",
        precision: "Точная настройка угла",
        tooltips: {
          windprev: "Поворот влево (-11.25°)",
          windsync: "Синхронизировать с текущим временем",
          windnext: "Поворот вправо (+11.25°)",
          windreset: "Сбросить ручные настройки / По умолчанию"
        }
      },
      products: {
        pineapples: "Ананасы", vanilla: "Ваниль", wine: "Вино", grog: "Грог",
        rugs: "Ковры", leather: "Кожа", cinnamon: "Корица", coffee: "Кофе",
        mango: "Манго", oil: "Масло", nuts: "Орехи", paprika: "Паприка",
        pepper: "Перец", beer: "Пиво", sugar: "Сахар", salt: "Соль",
        tobacco: "Табак", dates: "Финики", saffron: "Шафран", silk: "Шелк"
      },
      trade: {
        title: "Торговые цены",
        product: "Товар",
        price: "Цена",
        nodata: "Для этого порта нет торговых данных"
      },
      tradesys: {
        togglebtn: "Торговые маршруты",
        title: "Торговые рекомендации",
        subtitle: "Откройте самые прибыльные маршруты",
        from: "Откуда (Покупка)",
        to: "Куда (Продажа)",
        allports: "Все порты",
        calculate: "Найти маршруты",
        showingresults: "Лучшие маршруты (По эффективности)",
        emptystate: "Выберите порты, чтобы найти маршруты",
        noprofit: "Маршрутов, удовлетворяющих критериям, не найдено.",
        profit: "Прибыль",
        perweight: "За единицу веса",
        buy: "Покупка",
        sell: "Продажа",
        sortby: "Сортировать по",
        sortprofit: "Общая прибыль",
        sortefficiency: "Эффективность (Золото/Расст.)",
        sortdistance: "Минимальное расстояние",
        includepvp: "Включить зону PvP",
        distance: "Расстояние",
        pvpwarning: "⚔️ Проходит через зону PvP",
        clearroute: "Очистить маршрут",
        sortweightprofit: "Прибыль за единицу веса",
        perweightunit: "/ вес",
        cargocapacity: "Грузоподъемность",
        totalprofit: "Общая прибыль"
      },
      tooltip: {
        port: "Порт",
        clickfordetails: "Нажмите для подробностей",
        nodata: "Данные не найдены"
      },
      regionalpoints: {
        title: "Региональные очки",
        listtitle: "Список региональных ресурсов",
        goto: "Показать на карте",
        tooltip: {
          name: "ИМЯ:",
          resource: "РЕСУРС:",
          detail: "ПОДРОБНОСТИ:"
        },
        resources: {
          all: "Все",
          volcanicore: "Вулканическая руда",
          chestkey: "Ключ от сундука",
          chest: "Сундук",
          voodooskull: "Вуду-череп",
          insurance: "Страховка",
          battlemark: "Боевой знак",
          heavyshot: "Тяжелое ядро",
          saxonshot: "Саксонское ядро",
          fish: "Рыба",
          gold: "Золото",
          coin: "Монета"
        },
        unit: "шт."
      },
      portsettings: {
        title: "Настройки порта",
        owner: "Владелец",
        clan: "Клан",
        warhours: "Время войны",
        ownerplaceholder: "Имя игрока...",
        clanplaceholder: "Тег клана...",
        warplaceholder: "Пример: 20:00 - 21:00",
        iconselect: "Выбор иконки",
        iconscale: "Масштаб иконки",
        labelsize: "Размер текста",
        showicon: "Показать иконку",
        showlabel: "Показать название",
        icons: { k: "Малый", n: "Нейтральный", f: "Форт", p: "Пират" }
      },
      draw: {
        title: "Рисование и планирование",
        close: "Закрыть",
        sectiontools: "Инструменты",
        sectionoutline: "Контур (Outline)",
        sectionfill: "Заливка (Fill)",
        sectionicons: "Выбор иконок",
        sectionroute: "Информация о маршруте",
        sectionlayers: "Слои / Рисунки",
        outlinesize: "Толщина линии",
        opacity: "Прозрачность",
        distance: "Расстояние",
        time: "Время",
        routecount: "Маршрутов",
        hint: "💡 Зажмите, чтобы рисовать · Отпустите для завершения",
        undo: "Отменить",
        clearall: "Очистить всё",
        clearroutes: "Очистить маршруты",
        nodrawings: "Рисунков пока нет",
        contextmenu: {
          title: "Настройки выделения",
          outline: "Контур:",
          fill: "Заливка:",
          move: "Переместить",
          delete: "Удалить"
        },
        iconlabels: {
          anchor: "Якорь", ship: "Корабль", battle: "Битва", pirate: "Пират",
          danger: "Опасность", warning: "Предупреждение", defense: "Оборона", fire: "Огонь",
          bomb: "Бомба", castle: "Замок", mark: "Метка", star: "Звезда",
          flag: "Флаг", sword: "Меч", target: "Цель", treasure: "Сокровище"
        },
        tools: {
          select: "Выбрать", pen: "Перо", line: "Линия", rect: "Прямоугольник",
          circle: "Круг", polygon: "Многоугольник", area: "Область", text: "Текст",
          eraser: "Ластик", route: "Маршрут", icon: "Иконка", p2proute: "P2P маршрут", ping: "Пинг"
        }
      },
      wind: {
        compass: {
          n: "С", nne: "ССВ", ne: "СВ", ene: "ВСВ", e: "В", ese: "ВЮВ", se: "ЮВ", sse: "ЮЮВ",
          s: "Ю", ssw: "ЮЮЗ", sw: "ЮЗ", wsw: "ЗЮЗ", w: "З", wnw: "ЗСЗ", nw: "СЗ", nnw: "ССЗ"
        }
      },
      ports: {
        types: {
          small: "Малый порт", neutral: "Нейтральный порт", faction: "Порт форта",
          pirate: "Пиратский порт", unknown: "Порт"
        },
        tooltip: { owner: "ВЛАДЕЛЕЦ:", clan: "КЛАН:", war: "ВОЙНА:" },
        status: { safe: "БЕЗОПАСНО", active: "ИДЕТ ВОЙНА", startsin: "НАЧНЕТСЯ ЧЕРЕЗ" }
      },
      production: {
        resources: {
          demir: "Железо", kereste: "Древесина", deri: "Кожа", gumush: "Серебро",
          ipek: "Шелк", kenevir: "Конопля", kumash: "Ткань", tutun: "Табак", boya: "Краска",
          resin: "Смола", su: "Вода", rum: "Ром", komur: "Уголь", bakir: "Медь", ciftlik: "Ферма"
        }
      },
      tradeunits: { nm: "м.м.", min: "мин" },
      visitor: {
        count: "Количество посещений",
        buyrum: "Угостить меня ромом 🏴‍☠️"
      }
    },
    es: {
      app: { title: "World of Sea Battle - Mapa Interactivo" },
      sidebar: {
        brand: "World of Sea Battle",
        subtitle: "Mapa Interactivo por Vurkaçoğlu",
        windcontrol: "Control de Viento",
        date: "Fecha",
        time: "Hora",
        winddirection: "Dirección del Viento",
        maplayers: "Mapa",
        ports: "Puertos",
        lighthouses: "Faros",
        fasttravel: "Viaje Rápido",
        islands: "Islas Personales",
        production: "Sitios de Producción",
        altars: "Altares",
        forts: "Fuertes",
        pvpborder: "Frontera PvP",
        windlayer: "Flujo de Viento",
        language: "Idioma",
        drawtools: "Herramientas de Dibujo",
        portsettings: "Puertos",
        precision: "Rango de Precisión",
        tooltips: {
          windprev: "Girar a la izquierda (-11.25°)",
          windsync: "Sincronizar con hora actual",
          windnext: "Girar a la derecha (+11.25°)",
          windreset: "Restablecer ajustes manuales / Por defecto"
        }
      },
      products: {
        pineapples: "Piñas", vanilla: "Vainilla", wine: "Vino", grog: "Grog",
        rugs: "Alfombras", leather: "Cuero", cinnamon: "Canela", coffee: "Café",
        mango: "Mango", oil: "Aceite", nuts: "Nueces", paprika: "Pimentón",
        pepper: "Pimienta", beer: "Cerveza", sugar: "Azúcar", salt: "Sal",
        tobacco: "Tabaco", dates: "Dátiles", saffron: "Azafrán", silk: "Seda"
      },
      trade: {
        title: "Precios de Comercio",
        product: "Producto",
        price: "Precio",
        nodata: "Sin datos comerciales para este puerto"
      },
      tradesys: {
        togglebtn: "Rutas Comerciales",
        title: "Recomendaciones de Comercio",
        subtitle: "Descubre las rutas más rentables",
        from: "Desde (Compra)",
        to: "Hacia (Venta)",
        allports: "Todos los Puertos",
        calculate: "Buscar Rutas",
        showingresults: "Mejores rutas (Por Eficiencia)",
        emptystate: "Selecciona puertos para buscar rutas",
        noprofit: "No se encontraron rutas rentables con estos criterios.",
        profit: "Beneficio",
        perweight: "Por Unidad de Peso",
        buy: "Compra",
        sell: "Venta",
        sortby: "Ordenar Por",
        sortprofit: "Beneficio Total",
        sortefficiency: "Eficiencia (Oro/Dist)",
        sortdistance: "Distancia más corta",
        includepvp: "Incluir Zona PvP",
        distance: "Distancia",
        pvpwarning: "⚔️ Pasa por PvP",
        clearroute: "Limpiar Ruta",
        sortweightprofit: "Beneficio por Peso",
        perweightunit: "/ peso",
        cargocapacity: "Capacidad de Carga",
        totalprofit: "Beneficio Total"
      },
      tooltip: {
        port: "Puerto",
        clickfordetails: "Click para detalles",
        nodata: "Sin datos encontrados"
      },
      regionalpoints: {
        title: "Puntos Regionales",
        listtitle: "Lista de Recursos Regionales",
        goto: "Mostrar en Mapa",
        tooltip: {
          name: "NOMBRE:",
          resource: "RECURSO:",
          detail: "DETALLE:"
        },
        resources: {
          all: "Todos",
          volcanicore: "Mineral Volcánico",
          chestkey: "Llave de Cofre",
          chest: "Cofre",
          voodooskull: "Cráneo Vudú",
          insurance: "Seguro",
          battlemark: "Marca de Batalla",
          heavyshot: "Bala Pesada",
          saxonshot: "Bala Sajona",
          fish: "Pescado",
          gold: "Oro",
          coin: "Moneda"
        },
        unit: "Unidades"
      },
      portsettings: {
        title: "Ajustes de Puerto",
        owner: "Propietario",
        clan: "Clan",
        warhours: "Horarios de Guerra",
        ownerplaceholder: "Nombre del jugador...",
        clanplaceholder: "Etiqueta del clan...",
        warplaceholder: "Ej: 20:00 - 21:00",
        iconselect: "Selección de Icono",
        iconscale: "Escala de Icono",
        labelsize: "Tamaño de Etiqueta",
        showicon: "Mostrar Icono",
        showlabel: "Mostrar Etiqueta",
        icons: { k: "Pequeño", n: "Neutral", f: "Fuerte", p: "Pirata" }
      },
      draw: {
        title: "Dibujo y Planificación",
        close: "Cerrar",
        sectiontools: "Herramientas",
        sectionoutline: "Contorno (Outline)",
        sectionfill: "Relleno (Fill)",
        sectionicons: "Selector de Iconos",
        sectionroute: "Información de Ruta",
        sectionlayers: "Capas / Dibujos",
        outlinesize: "Grosor de Línea",
        opacity: "Opacidad",
        distance: "Distancia",
        time: "Tiempo",
        routecount: "Rutas",
        hint: "💡 Mantén presionado para dibujar · Suelta para terminar",
        undo: "Deshacer",
        clearall: "Limpiar Todo",
        clearroutes: "Limpiar Rutas",
        nodrawings: "Sin dibujos aún",
        contextmenu: {
          title: "Ajustes de Selección",
          outline: "Contorno:",
          fill: "Relleno:",
          move: "Mover",
          delete: "Eliminar"
        },
        iconlabels: {
          anchor: "Ancla", ship: "Barco", battle: "Batalla", pirate: "Pirata",
          danger: "Peligro", warning: "Advertencia", defense: "Defensa", fire: "Fuego",
          bomb: "Bomba", castle: "Castillo", mark: "Marca", star: "Estrella",
          flag: "Bandera", sword: "Espada", target: "Objetivo", treasure: "Tesoro"
        },
        tools: {
          select: "Seleccionar", pen: "Pluma", line: "Línea", rect: "Rect",
          circle: "Círculo", polygon: "Polígono", area: "Área", text: "Texto",
          eraser: "Borrador", route: "Ruta", icon: "Icono", p2proute: "Ruta P2P", ping: "Ping"
        }
      },
      wind: {
        compass: {
          n: "N", nne: "NNE", ne: "NE", ene: "ENE", e: "E", ese: "ESE", se: "SE", sse: "SSE",
          s: "S", ssw: "SSW", sw: "SW", wsw: "WSW", w: "W", wnw: "WNW", nw: "NW", nnw: "NNW"
        }
      },
      ports: {
        types: {
          small: "Puerto pequeño", neutral: "Puerto neutral", faction: "Puerto fuerte",
          pirate: "Puerto pirata", unknown: "Puerto"
        },
        tooltip: { owner: "PROPIETARIO:", clan: "CLAN:", war: "GUERRA:" },
        status: { safe: "SEGURO", active: "GUERRA ACTIVA", startsin: "COMIENZA EN" }
      },
      production: {
        resources: {
          demir: "Hierro", kereste: "Madera", deri: "Cuero", gumush: "Plata",
          ipek: "Seda", kenevir: "Cáñamo", kumash: "Tela", tutun: "Tabaco", boya: "Tinte",
          resin: "Resina", su: "Agua", rum: "Ron", komur: "Carbón", bakir: "Cobre", ciftlik: "Granja"
        }
      },
      tradeunits: { nm: "mn", min: "min" },
      visitor: {
        count: "Contador de Visitas",
        buyrum: "Invítame a un Ron 🏴‍☠️"
      }
    },
    zh: {
      app: { title: "World of Sea Battle - 交互式地图" },
      sidebar: {
        brand: "World of Sea Battle",
        subtitle: "交互式地图由 Vurkaçoğlu 制作",
        windcontrol: "风向控制",
        date: "日期",
        time: "时间",
        winddirection: "风向",
        maplayers: "地图",
        ports: "港口",
        lighthouses: "灯塔",
        fasttravel: "快速旅行",
        islands: "私人岛屿",
        production: "产地",
        altars: "祭坛",
        forts: "堡垒",
        pvpborder: "PvP 边界",
        windlayer: "风向流",
        language: "语言",
        drawtools: "绘图工具",
        portsettings: "港口",
        precision: "精确范围",
        tooltips: {
          windprev: "向左旋转 (-11.25°)",
          windsync: "同步至当前时间",
          windnext: "向右旋转 (+11.25°)",
          windreset: "重置手动设置 / 回到出厂"
        }
      },
      products: {
        pineapples: "菠萝", vanilla: "香草", wine: "葡萄酒", grog: "格罗格酒",
        rugs: "地毯", leather: "皮革", cinnamon: "肉桂", coffee: "咖啡",
        mango: "芒果", oil: "油脂", nuts: "坚果", paprika: "红辣椒",
        pepper: "胡椒", beer: "啤酒", sugar: "糖", salt: "盐",
        tobacco: "烟草", dates: "椰枣", saffron: "藏红花", silk: "丝绸"
      },
      trade: {
        title: "贸易价格",
        product: "产品",
        price: "价格",
        nodata: "此港口无贸易数据"
      },
      tradesys: {
        togglebtn: "贸易路线",
        title: "贸易推荐",
        subtitle: "发现利润最高的路线",
        from: "始发点 (买入)",
        to: "目的地 (卖出)",
        allports: "所有港口",
        calculate: "寻找路线",
        showingresults: "最佳路线 (按效率)",
        emptystate: "选择港口以寻找路线",
        noprofit: "在此标准下未找到盈利路线。",
        profit: "利润",
        perweight: "单位重量利润",
        buy: "买入",
        sell: "卖出",
        sortby: "排序方式",
        sortprofit: "总利润",
        sortefficiency: "效率 (金币/距离)",
        sortdistance: "最短距离",
        includepvp: "包含 PvP 区域",
        distance: "距离",
        pvpwarning: "⚔️ 穿过 PvP 区域",
        clearroute: "清除路线",
        sortweightprofit: "单位重量利润",
        perweightunit: "/ 重量",
        cargocapacity: "货舱容量",
        totalprofit: "总利润"
      },
      tooltip: {
        port: "港口",
        clickfordetails: "点击查看详情",
        nodata: "未找到数据"
      },
      regionalpoints: {
        title: "区域点",
        listtitle: "区域资源列表",
        goto: "在地图上显示",
        tooltip: {
          name: "名称:",
          resource: "资源:",
          detail: "详情:"
        },
        resources: {
          all: "全部",
          volcanicore: "火山矿",
          chestkey: "箱子钥匙",
          chest: "箱子",
          voodooskull: "巫毒头骨",
          insurance: "保险",
          battlemark: "战利品",
          heavyshot: "重弹",
          saxonshot: "撒克逊弹",
          fish: "鱼",
          gold: "黄金",
          coin: "银币"
        },
        unit: "个"
      },
      portsettings: {
        title: "港口设置",
        owner: "所有者",
        clan: "工会",
        warhours: "战争时间",
        ownerplaceholder: "玩家名称...",
        clanplaceholder: "工会标签...",
        warplaceholder: "例如: 20:00 - 21:00",
        iconselect: "图标选择",
        iconscale: "图标缩放",
        labelsize: "标签大小",
        showicon: "显示图标",
        showlabel: "显示标签",
        icons: { k: "小型", n: "中立", f: "堡垒", p: "海盗" }
      },
      draw: {
        title: "绘图与规划",
        close: "关闭",
        sectiontools: "工具",
        sectionoutline: "轮廓",
        sectionfill: "填充",
        sectionicons: "图标选择",
        sectionroute: "路线信息",
        sectionlayers: "图层 / 绘图",
        outlinesize: "线宽",
        opacity: "透明度",
        distance: "距离",
        time: "时长",
        routecount: "路线数",
        hint: "💡 按住绘图 · 释放完成",
        undo: "撤销",
        clearall: "清除所有",
        clearroutes: "清除路线",
        nodrawings: "暂无绘图",
        contextmenu: {
          title: "选择设置",
          outline: "轮廓:",
          fill: "填充:",
          move: "移动",
          delete: "删除"
        },
        iconlabels: {
          anchor: "锚", ship: "船", battle: "战斗", pirate: "海盗",
          danger: "危险", warning: "警告", defense: "防御", fire: "火",
          bomb: "炸弹", castle: "城堡", mark: "标记", star: "星",
          flag: "旗帜", sword: "剑", target: "目标", treasure: "宝藏"
        },
        tools: {
          select: "选择", pen: "钢笔", line: "线", rect: "矩形",
          circle: "圆", polygon: "多边形", area: "面积", text: "文字",
          eraser: "橡皮擦", route: "路线", icon: "图标", p2proute: "P2P 路线", ping: "信号"
        }
      },
      wind: {
        compass: {
          n: "北", nne: "东北北", ne: "东北", ene: "东西北", e: "东", ese: "东西南", se: "东南", sse: "东南南",
          s: "南", ssw: "西南南", sw: "西南", wsw: "西西南", w: "西", wnw: "西北西", nw: "西北", nnw: "北西北"
        }
      },
      ports: {
        types: {
          small: "小港口", neutral: "中立港口", faction: "堡垒港口",
          pirate: "海盗港口", unknown: "港口"
        },
        tooltip: { owner: "所有者:", clan: "工会:", war: "战争:" },
        status: { safe: "安全", active: "战争活动中", startsin: "开始于" }
      },
      production: {
        resources: {
          demir: "铁", kereste: "木材", deri: "皮革", gumush: "银",
          ipek: "丝绸", kenevir: "大麻", kumash: "布料", tutun: "烟草", boya: "染料",
          resin: "树脂", su: "水", rum: "朗姆酒", komur: "煤炭", bakir: "铜", ciftlik: "农场"
        }
      },
      tradeunits: { nm: "海里", min: "分钟" },
      visitor: {
        count: "访客次数",
        buyrum: "请我喝杯朗姆酒 🏴‍☠️"
      }
    }
  };

  let currentLang = "tr";
  try {
    currentLang = localStorage.getItem("sb-lang") || "tr";
  } catch (e) {}
  let translations = LANG_DATA[currentLang] || LANG_DATA.tr;

  // Nested key'den değer al: "sidebar.ports" → translations.sidebar.ports (Case-insensitive)
  function t(key) {
    if (!key) return "";
    const keys = key.toLowerCase().split(".");
    let val = translations;
    for (const k of keys) {
      if (val && typeof val === "object" && k in val) {
        val = val[k];
      } else {
        return key;
      }
    }
    return typeof val === "string" ? val : key;
  }

  // [data-i18n] attribute'lu tüm elementleri güncelle
  function updateDOM() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const translated = t(key);
      if (translated !== key) el.textContent = translated;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      const translated = t(key);
      if (translated !== key) el.placeholder = translated;
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title");
      const translated = t(key);
      if (translated !== key) el.title = translated;
    });
  }

  // Dil değiştir
  function setLanguage(lang) {
    if (!LANG_DATA[lang]) return;
    currentLang = lang;
    translations = LANG_DATA[lang];
    try {
      localStorage.setItem("sb-lang", lang);
    } catch (e) {}
    updateDOM();

    const selector = document.getElementById("lang-select");
    if (selector) selector.value = lang;

    window.dispatchEvent(
      new CustomEvent("languageChanged", { detail: { lang } }),
    );
  }

  function getCurrentLang() {
    return currentLang;
  }

  // Başlat
  function init() {
    translations = LANG_DATA[currentLang] || LANG_DATA.tr;
    updateDOM();

    const selector = document.getElementById("lang-select");
    if (selector) {
      selector.value = currentLang;
      selector.addEventListener("change", (e) => setLanguage(e.target.value));
    }
  }

  return { t, setLanguage, getCurrentLang, init, updateDOM };
})();

document.addEventListener("DOMContentLoaded", () => {
  i18n.init();
});
