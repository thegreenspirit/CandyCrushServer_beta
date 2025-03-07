window['SocialChannels'] = function () {
    var sessionKey;
    var userId;
    var facebookAppId;
    var canvasPageUrl;
    var nameSpace;
    var graphObjectUrl;
    var facebookPageId;
    var afterFbInitCallbacks = [];
    var preDialogCallbacks = [];
    var postDialogCallbacks = [];
    var fbIsInitialized = false;
    var urlHandler;
    var useFloating = false;
    var oscif;
    var useLocalPayments;
    var friends = null;

    var init = function (callerArgs) {
        if (typeof (Plataforma) == 'undefined') {
            throw new Error('SocialChannels.kingdom requires Plataforma');
        }
        Plataforma.getRpc = function () {
            return king.rpc;
        };

        var defaultArgs = {
            sessionKey: '[sessionKey]',
            facebookAppId: '[facebookAppId]',
            canvasPageUrl: '[canvasPageUrl]',
            nameSpace: '[nameSpace]',
            graphObjectUrl: '[graphObjectUrl]',
            facebookPageId: '[facebookPageId]',
            userId: '[userId]',
            useFloating: '[useFloating]',
            oscif: true,
            useLocalPayments: false
        };
        var args = Plataforma.merge(defaultArgs, callerArgs, true);
        if (console) console.log('SocialChannels.kingdom.init(). args=', args);

        sessionKey = args.sessionKey;
        userId = args.userId;
        facebookAppId = args.facebookAppId;
        canvasPageUrl = args.canvasPageUrl;
        nameSpace = args.nameSpace;
        graphObjectUrl = args.graphObjectUrl;
        facebookPageId = args.facebookPageId;
        useFloating = args.useFloating == true;
        oscif = args.oscif;
        useLocalPayments = args.useLocalPayments;

    };

    var registerPreDialogCallback = function (callback) {
        preDialogCallbacks.push(callback);
    };

    var unregisterPreDialogCallback = function (callback) {
        unregisterCallback(preDialogCallbacks, callback);
    };

    var registerPostDialogCallback = function (callback) {
        postDialogCallbacks.push(callback);
    };

    var unregisterPostDialogCallback = function (callback) {
        unregisterCallback(postDialogCallbacks, callback);
    };

    var unregisterCallback = function (callbackArray, callback) {
        for (var p in callbackArray) {
            if (callbackArray[p] === callback) {
                callbackArray.splice(p, 1);
            }
        }
    };

    //Not implemented
    var setUrlHandler = function (urlHandler) {
        console.log("setting url handler");
    };

    //Untested
    var sendPost = function (callerArgs, callback) {
        var defaultArgs = {
            title: '[title]',
            body: '[body]',
            linkText: '[linkText]',
            linkParams: {},
            image: '[image]',
            trackingType: '[trackingType]'
        };
        var args = Plataforma.merge(defaultArgs, callerArgs, true);

        console.log("Sending post", args);

        // Construct link with parameters
        var link = Link.stringify(canvasPageUrl, args.linkParams);
        if (args.feedGame) {
            link = graphObjectUrl + "/video?type=video&from=" + encodeURIComponent(userId) + "&redirect=" + encodeURIComponent(link);
        }

        var onSuccess = function () {
            //No recipients are returned
            callback({ 'status': 'ok', 'recipients': []});
        };

        var onError = function () {
            console.log('error response=');
            callback({ 'status': 'error' });
        };

        performCallbacks(preDialogCallbacks);
        king.social.post.send(new king.Post(args.title, args.body, args.image, args.linkText, link, args.linkParams), args.trackingType, onSuccess, onError);
    };

    //Not yet supported
    var graphPost = function (graphUrl, args) {
        console.log('Posting to graphUrl=' + graphUrl);
    };

    var sendPostToUser = function (callerArgs, callback) {
        var defaultArgs = {
            recipient: '[recipient]',
            title: '[title]',
            body: '[body]',
            linkText: '[linkText]',
            linkParams: {},
            image: '[image]',
            trackingType: '{trackingType]',
            messageId: 0
        };
        var args = Plataforma.merge(defaultArgs, callerArgs, true);

        var link = Link.stringify(canvasPageUrl, args.linkParams);

        var onSuccess = function () {
            callback({ 'status': 'ok', 'recipients': args.recipient });
        };

        var onError = function () {
            console.log('error response=');
            callback({ 'status': 'error' });
        };

        king.social.post.sendToUser(args.recipient, new king.Post([args.recipient], args.title, args.body, args.linkText, link, args.image, args.linkParams), args.trackingType, onSuccess, onError);

    };

    var sendNotification = function (callerArgs, callback) {
        var defaultArgs = {
            recipients: undefined,
            type: 'message',
            urlMessage: undefined,
            urlMessageId: undefined,
            title: '[title]',
            body: '[body]',
            linkText: '[linkText]',
            image: '[image]',
            trackingType: '[trackingType]'
        };
        var args = Plataforma.merge(defaultArgs, callerArgs, true);

        console.log("Sending notification", args);

        var onSuccess = function () {
            callback({ 'status': 'ok', 'recipients': args.recipients });
        };

        var onError = function () {
            console.log('error response=');
            callback({ 'status': 'error' });
        };

        king.social.notification.send(new king.Notification(args.recipients, args.title, args.body, null, new king.EncodedUrlMessageDto(args.urlMessageId, args.urlMessage), null, null, null), args.trackingType, onSuccess, onError);

    };

    var getGamePageUrl = function () {
        return canvasPageUrl;
    };

    var publishStory = function (verb, details) {
    };

    var hasDepositFunds = function () {
        return false;
    };

    //Not supported
    var hasEarnFunds = function () {
        return true;
    };

    //Not supported
    var hasLike = function () {
        return true;
    };

    //Not supported
    var getDoesLike = function (success, error) {
        success(false);
    };

    var setUserId = function (id) {
        userId = id;
    };

    var performPreDialogCallbacks = function () {
        performCallbacks(preDialogCallbacks);
    };

    var performPostDialogCallbacks = function () {
        performCallbacks(postDialogCallbacks);
    };

    var performCallbacks = function (callbackArray) {
        for (var i = 0; i < callbackArray.length; i += 1) {
            callbackArray[i]();
        }
    };

    var callAfterInit = function (callback) {
        king.util.callAfterInit(callback);
    };

    var getExternalId = function (coreUserId, callback) {
        console.log('getExternalId ' + coreUserId);
        Plataforma.getRpc().remoteCall("FacebookApi.getFacebookIdForUserId", [coreUserId],
            function (result) {
                callback({ status: 'ok', externalId: result });
            },
            function (error) {
                callback({ status: 'error', error: JSON.stringify(error) });
            }
        );
    };

    //Not yet supported
    var getAvailableArea = function (callback) {
        callback({"width": 600, "height": 500});
    };

    //Not yet supported
    var depositFunds = function (callback) {
        callback(null);
    };

    //Not yet supported
    var earnFunds = function (callback) {
        callback(null);
    };

    //Not yet supported
    var setAreaSize = function (size) {
    };

    //Not yet supported
    var checkMessages = function (callback) {
        Plataforma.getRpc().remoteCall("FacebookApi.triggerRequestsDownload", [],
            function (result) {
                callback({ status: 'ok', externalId: result });
            },
            function (error) {
                callback({ status: 'error', error: JSON.stringify(error) });
            }
        );
    };

    var requestFriends = function (appId, callback) {
        if (friends == null || friends.length == 0) {
            king.social.getAllFriends(function (response) {
                    friends = [];
                    for (var i = 0; i < response.length; i++) {
                        var friend = response[i];
                        var picture = friend.picture;
                        friend.id = "" + friend.userId;
                        friend.first_name = friend.firstName;
                        delete friend.userId;

                        friend.picture = {"data": {is_silhouette: false, url: picture}};
                        friends.push(friend);
                    }
                    callback({status: "success", data: friends});
                },
                function (response) {
                    callback({status: "error", data: []});
                });
        }
        else {
            callback({status: "success", data: friends});
        }
    };
    
    var requestInvitableFriends = function (callback) {
        if (invitableFriends == null) {
            king.social.getInvitableFriends(function (response) {
                    invitableFriends = [];
                    for (var i = 0; i < response.length; i++) {
                        var friend = response[i];
                        var picture = friend.picture;
                        friend.id = "" + friend.inviteToken;
                        friend.first_name = friend.firstName;

                        friend.picture = {"data": {is_silhouette: false, url: picture}};
                        invitableFriends.push(friend);
                    }
                    callback({status: "success", data: invitableFriends});
                },
                function (response) {
                    callback({status: "error", data: []});
                });
        }
        else {
            callback({status: "success", data: invitableFriends});
        }
    };
    
    var reRequest = function (permission, refreshFriends, callback) {
        callback({status: "success", data: []});
    };

    return {
        init: init,
        registerPreDialogCallback: registerPreDialogCallback,
        unregisterPreDialogCallback: unregisterPreDialogCallback,
        registerPostDialogCallback: registerPostDialogCallback,
        unregisterPostDialogCallback: unregisterPostDialogCallback,
        performPreDialogCallbacks: performPreDialogCallbacks,
        performPostDialogCallbacks: performPostDialogCallbacks,
        addInitCallback: callAfterInit,
        setUrlHandler: setUrlHandler,
        getExternalId: getExternalId,
        sendPost: sendPost,
        sendPostToUser: sendPostToUser,
        sendNotification: sendNotification,
        publishStory: publishStory,
        hasDepositFunds: hasDepositFunds,
        depositFunds: depositFunds,
        hasEarnFunds: hasEarnFunds,
        earnFunds: earnFunds,
        hasLike: hasLike,
        getDoesLike: getDoesLike,
        getGamePageUrl: getGamePageUrl,
        getAvailableArea: getAvailableArea,
        setAreaSize: setAreaSize,
        graphPost: graphPost,
        callAfterFbInit: callAfterInit,
        checkMessages: checkMessages,
        setUserId: setUserId,
        requestFriends: requestFriends,
        requestInvitableFriends: requestInvitableFriends,
        reRequest: reRequest
    };
}();
