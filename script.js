// Create a connection to the rosbridge WebSocket server.
var ros = new ROSLIB.Ros({
    url: 'ws://localhost:9090'
});

// Connection error handler
ros.on('error', function(error) {
    console.log('Error connecting to websocket server: ', error);
    document.body.insertAdjacentHTML('beforeend', '<p style="color:red;">Error connecting to websocket server.</p>');
});

// Connection established handler
ros.on('connection', function() {
    console.log('Connected to websocket server.');

    // Define the blacklist
    var blacklist = ['/rosbridge_websocket', '/rosapi', '/rosout'];

    // Get the list of nodes
    var nodesClient = new ROSLIB.Service({
        ros: ros,
        name: '/rosapi/nodes',
        serviceType: 'rosapi/Nodes'
    });

    var nodeDetailsClient = new ROSLIB.Service({
        ros: ros,
        name: '/rosapi/node_details',
        serviceType: 'rosapi/NodeDetails'
    });

    var topicTypeClient = new ROSLIB.Service({
        ros: ros,
        name: '/rosapi/topic_type',
        serviceType: 'rosapi/TopicType'
    });

    var serviceTypeClient = new ROSLIB.Service({
        ros: ros,
        name: '/rosapi/service_type',
        serviceType: 'rosapi/ServiceType'
    });

    var request = new ROSLIB.ServiceRequest();

    nodesClient.callService(request, function(result) {
        // Filter and sort nodes
        var filteredNodes = result.nodes.filter(function(node) {
            return !blacklist.includes(node);
        }).sort();

        var nodesDetails = [];

        // Fetch details for each node
        filteredNodes.forEach(function(node, index) {
            var nodeRequest = new ROSLIB.ServiceRequest({ node: node });

            nodeDetailsClient.callService(nodeRequest, function(nodeResult) {
                // Filter out '/rosout' from subscribed and published topics
                var subscribedTopicsPromises = nodeResult.subscribing.filter(topic => topic !== '/rosout').map(topic => {
                    return new Promise((resolve, reject) => {
                        var request = new ROSLIB.ServiceRequest({ topic: topic });
                        topicTypeClient.callService(request, function(result) {
                            resolve({ name: topic, type: 'subscribed', messageType: result.type.replace('msg:', '') });
                        }, function(error) {
                            console.log('Error calling service: ', error);
                            reject(error);
                        });
                    });
                });

                var publishedTopicsPromises = nodeResult.publishing.filter(topic => topic !== '/rosout').map(topic => {
                    return new Promise((resolve, reject) => {
                        var request = new ROSLIB.ServiceRequest({ topic: topic });
                        topicTypeClient.callService(request, function(result) {
                            resolve({ name: topic, type: 'published', messageType: result.type.replace('msg:', '') });
                        }, function(error) {
                            console.log('Error calling service: ', error);
                            reject(error);
                        });
                    });
                });

                var servicesPromises = nodeResult.services.filter(service => {
                    return !service.endsWith('get_loggers') && !service.endsWith('set_logger_level');
                }).map(service => {
                    return new Promise((resolve, reject) => {
                        var request = new ROSLIB.ServiceRequest({ service: service });
                        serviceTypeClient.callService(request, function(result) {
                            resolve({ name: service, type: 'service', serviceType: result.type });
                        }, function(error) {
                            console.log('Error calling service: ', error);
                            reject(error);
                        });
                    });
                });

                Promise.all([...subscribedTopicsPromises, ...publishedTopicsPromises, ...servicesPromises]).then(function(allTopicsServices) {
                    nodesDetails.push({
                        node: node,
                        topicsServices: allTopicsServices
                    });

                    // Only render the table after all details are fetched
                    if (nodesDetails.length === filteredNodes.length) {
                        // Sort nodesDetails by node name
                        nodesDetails.sort((a, b) => a.node.localeCompare(b.node));

                        var nodesTableBody = document.getElementById('nodesTable').querySelector('tbody');
                        nodesTableBody.innerHTML = '';

                        nodesDetails.forEach(function(nodeDetail) {
                            var row = document.createElement('tr');
                            var nodeNameCell = document.createElement('td');
                            nodeNameCell.textContent = nodeDetail.node;
                            row.appendChild(nodeNameCell);

                            // Separate topics and services
                            var subscribedTopics = nodeDetail.topicsServices.filter(item => item.type === 'subscribed').map(item => `${item.name} (${item.messageType})`).join(', ');
                            var publishedTopics = nodeDetail.topicsServices.filter(item => item.type === 'published').map(item => `${item.name} (${item.messageType})`).join(', ');
                            var services = nodeDetail.topicsServices.filter(item => item.type === 'service').map(item => `${item.name} (${item.serviceType})`).join(', ');

                            // Create cells for each type
                            var subscribedTopicsCell = document.createElement('td');
                            var publishedTopicsCell = document.createElement('td');
                            var servicesCell = document.createElement('td');

                            subscribedTopicsCell.textContent = subscribedTopics;
                            publishedTopicsCell.textContent = publishedTopics;
                            servicesCell.textContent = services;

                            row.appendChild(subscribedTopicsCell);
                            row.appendChild(publishedTopicsCell);
                            row.appendChild(servicesCell);

                            nodesTableBody.appendChild(row);
                        });
                    }
                }).catch(function(error) {
                    console.log('Error fetching topic and service types: ', error);
                });
            });
        });
    }, function(error) {
        console.log('Error calling service: ', error);
        document.body.insertAdjacentHTML('beforeend', '<p style="color:red;">Error calling service.</p>');
    });
});

// Connection closed handler
ros.on('close', function() {
    console.log('Connection to websocket server closed.');
    document.body.insertAdjacentHTML('beforeend', '<p style="color:red;">Connection to websocket server closed.</p>');
});
