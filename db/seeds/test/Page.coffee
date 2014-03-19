Page.seed ->
    id: 1
    title: 'Home'
    url: 'example.com'
    customUrl: null
    grid: '02-two-columns'
    columns: [{"size":"4","widgets":[1]},{"size":"6","widgets":[]},{"size":"6","widgets":[]}]
    widgets: [{"id":1,"type":"core-widgets/static","settings":{"title":"Hello world", "content": "Contents of single widget"}}]
    metaTitle: null
    metaDescription: null
    metaKeywords: null
    type: null
    tags: null
    hideFromNavigation: null
    order: null
    templateId: null
    parentId: null
    groupId: 1

Page.seed ->
    id: 2
    title: 'Extranet'
    url: 'example.com/extranet'
    customUrl: null
    grid: '02-two-columns'
    columns: [{"size":"4","widgets":[1,4]},{"size":"6","widgets":[3,2]}]
    widgets: [{"id":1,"type":"core-widgets/group-header","settings":{"title":"Hello world", "content": "Widget 1"}}, {"id":2,"type":"core-widgets/static","settings":{"title":"Hello world", "content": "Widget 2"}}, {"id":3,"type":"core-widgets/static","settings":{"title":"Hello world", "content": "Widget 3"}}, {"id":4,"type":"core-widgets/static","settings":{"title":"Hello world", "content": "Widget 4"}}]
    metaTitle: null
    metaDescription: null
    metaKeywords: null
    type: null
    tags: null
    hideFromNavigation: null
    order: null
    templateId: null
    parentId: null
    groupId: 2

Page.seed ->
    id: 3
    title: '501'
    url: 'example.com/new'
    customUrl: null
    grid: '02-two-columns'
    columns: [{"size":"4","widgets":[1]},{"size":"6","widgets":[]},{"size":"6","widgets":[]}]
    widgets: [{"id":1,"type":"core-widgets/static","settings":{"title":"Hello world", "content": "Click me to edit"}}]
    metaTitle: null
    metaDescription: null
    metaKeywords: null
    type: null
    tags: null
    hideFromNavigation: true
    order: null
    templateId: null
    parentId: null
    groupId: 1
