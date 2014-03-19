User.seed ->
    id: 1
    username: 'test'
    email: 'test@test.com'
    password: 'test'
    memberships: [{id: 1, groupId: 1, role: 'user'}]

User.seed ->
    id: 2
    username: 'admin'
    email: 'admin@test.com'
    password: 'admin'
    memberships: [{id: 1, groupId: 1, role: 'owner'}]
