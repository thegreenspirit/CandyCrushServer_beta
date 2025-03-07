window['CandyJsApi'] = function () {

    var APPID = "17";

    var settings = {};
    var invitableFriends = [];
    var authResponseCallbacks = [];
    var authResponseChanged = false;
    var openGraphNppUrl = "";
    var hasFetchedInvitableFriends = false;
    var requestInvitableFriendsCallbacks = null;

    var fetchInvitableFriends = function () {   // Prefetch invitable friends
        SocialChannels.addInitCallback(function () {
            addAuthResponseCallback(function () {
                requestInvitableFriends(function(response) {});
            });
        });
    };

    var init = function (args) {
        var defaultArgs = {
            sessionKey:'[sessionKey]',
            appId: APPID
        };
        settings = Plataforma.merge(defaultArgs, args, true);
        console.log('Candycrush.init() settings=', settings);

        SocialChannels.addInitCallback(function () {
            fetchInvitableFriends();
        });

        SocialChannels.addInitCallback(function () {
            if (window.FB) {
                FB.Event.subscribe('auth.authResponseChange', function (response) {
                    authResponseChanged = true;
                    runAuthResponseCallbacks();
                });
            }
        });
    };

    var setOpenGraphNppUrl = function (url) {
        openGraphNppUrl = url;
    };

    var giveBoosterToUsers = function(title, message, toExtUserIds, image, booster, episode, level, callback) {
        var args = {
            title: title,
            message: message,
            toExtUserId: toExtUserIds,
            episode: episode,
            level: level
        };

        console.log('Candycrush.giveBoosterToUser() args=', JSON.stringify(args));

        getRpc().remoteCall("CandyCrushAPI.getBoosterGiftUrlMessage", [booster, episode, level],
            function(urlMessage) {
                console.log("callback from CandyCrushAPI.getBoosterGiftUrlMessage: result=", urlMessage);
                Saga.openRequestDialog("giveBoosterToUsers_" + booster, title, message, image, 'gift', urlMessage, toExtUserIds, function(response) {
                    console.log('response = ', JSON.stringify(response));
                    // Pass response back to flash
                    // response =  {"status":"ok","recipients":["734277962"]}
                    // response =  {"status":"error"}                 });
                    // giveBoosterToUserCallback(response);
                    callback(response);
                });
            },
            function(error) {
                reportError(error);
                console.log(error);
                // giveBoosterToUserCallback({status:"error"});
                callback(response);
            }
        );
    };

    var sendSeasonalMessage = function (title, body, prompt, image, messageType, toExternalUserId, callback) {
        var trackingType = "seasonalMessage";

        getRpc().remoteCall("CandyCrushAPI.getSeasonalUrlMessage", [trackingType,  messageType],
            function (apiUrlMessage) {
                console.log("callback from CandyCrushAPI.getSeasonalUrlMessage: result=", apiUrlMessage);
                Saga.sendPostToUser(trackingType, title, prompt, body, image, apiUrlMessage, toExternalUserId, function (response) {
                    callback(response);
                });
            },
            function (error) {
                reportError(error);
                console.log(error);
                callback(error);
            }
        );
    };

    var getCandyProperties = function(callback) {
        getRpc().remoteCall("CandyCrushAPI.getCandyProperties", [],
            function(json) {
                callback(json.candyProperties);
            },
            function (error) {
                reportError(error);
                console.log(error);
                callback({status:"error"})
            }
        );
    };

    var setCandyProperty = function(name, value, callback) {
        getRpc().remoteCall("CandyCrushAPI.setCandyProperty", [name, value],
            function() {
                callback();
            },
            function (error) {
                reportError(error);
                console.log(error);
                callback({status:"error"})
            }
        );
    };

    var deliverInitialHardCurrencyGiftForIntroPop = function(callback) {
        getRpc().remoteCall("CandyCrushAPI.deliverInitialHardCurrencyGiftForIntroPop", [],
            function() {
                callback();
            },
            function (error) {
                console.log(error);
                callback({status:"error"})
            }
        );
    };

    var deliverInitialHardCurrencyGiftForBankTutorial = function(callback) {
        getRpc().remoteCall("CandyCrushAPI.deliverInitialHardCurrencyGiftForBankTutorial", [],
            function() {
                callback();
            },
            function (error) {
                console.log(error);
                callback({status:"error"})
            }
        );
    };

    var addAuthResponseCallback = function (callback) {
        if (authResponseChanged) {
            callback();
        } else {
            authResponseCallbacks.push(callback);
        }
    };

    var runAuthResponseCallbacks = function () {
        for (var i = 0; i < authResponseCallbacks.length; i++) {
            authResponseCallbacks[i]();
        }
        authResponseCallbacks = [];
    };

    function reportError(error) {
        var err = new Error();
        var stacktrace = err.stack ? err.stack.split('\n', 2).join("*") : "";
        Plataforma.ClientHealthTracking.clientException(1, navigator.userAgent + "*" + JSON.stringify(error) + "*" + stacktrace);
    };

    var getInvitableFriends = function (callback) {
        requestInvitableFriends(function(response) { callback(response.data) });
    };

    var requestInvitableFriends = function(callback)
    {
        if (hasFetchedInvitableFriends) {
            callback({"status": "success", "data":invitableFriends});
            return;
        }
        if (requestInvitableFriendsCallbacks != null) {
            requestInvitableFriendsCallbacks.push(callback);
            return;
        }
        requestInvitableFriendsCallbacks = [];
        requestInvitableFriendsCallbacks.push(callback);
        SocialChannels.requestInvitableFriends(function(response) {
            if (response.status == "success") {
                invitableFriends = response.data;
                hasFetchedInvitableFriends = true;
            }
            for (var i = 0; i < requestInvitableFriendsCallbacks.length; i++) {
                requestInvitableFriendsCallbacks[i](response);
            }
            requestInvitableFriendsCallbacks = null;
        });
    };

    var getRpc = function () {
        return Plataforma.getRpc();
    };

    var openInviteFriendsDialog = function(title, message, ids, callback) {
        if (ids != null && ids.length > 0) {
            var trackingType = "invite";
            getRpc().remoteCall("SagaApi.getInviteUrlMessage", [trackingType],
                    function (urlMessage) {
                        console.log("callback from SagaApi.getInviteUrlMessage: result=", urlMessage);
                        Saga.openRequestDialog(trackingType, title, message, undefined, "invite", urlMessage, ids, function(response) {
                            callback(response)
                        });
                    },
                    function (error) {
                        console.log(error);
                        callback({status:"error"})
                    }
                );
        }
        else {
            callback({status:"error"})
        }
    };
    

    var notifyProductGiftToUser = function (title, message, productId, externalUserId, image, callback) {
        var trackingType = "gift_" + productId;
        getRpc().remoteCall("SagaApi.getProductGiftUrlMessage", [0, productId, trackingType],
            function (urlMessage) {
                console.log("callback from SagaApi.getProductGiftUrlMessage: result=", urlMessage);
                Saga.openRequestDialog(trackingType, title, message, image, 'gift', urlMessage, [externalUserId], function(response) {
                    callback(response);
                });
            },
            function (error) {
                console.log(error);
                callback({status:"error"})
            }
        );
    };

    var isNppEligible = function(externalUserId) {
        var obj;
        if (window.FB) {
            FB.api('/'+externalUserId+'?fields=is_eligible_promo', function(response) {
                console.log(response);
                if(response.is_eligible_promo == 1)
                {
                    obj = {
                        message: 'Npp is available for user',
                        status: 'ok'
                    };
                } else {
                    obj = {
                        message: 'Npp is not available for user',
                        status: 'error'
                    };
                }
                Saga.getGame().isNppEligibleCallback(obj);
            });
        }
        else {
            obj = {
                message: 'Npp is not available for user',
                status: 'error'
            };
            Saga.getGame().isNppEligibleCallback(obj);
        }
    };

    var openNppDialog = function() {
        if (window.FB){
            console.log("NPP: " + openGraphNppUrl);
            var obj = {
                method: 'fbpromotion',
                display: 'popup',
                package_name: 'zero_promo',
                product: openGraphNppUrl
            };

            FB.ui(obj, npp_callback);
        }
    };

    var npp_callback = function(response) {
        obj = {
            message: 'Npp is registered for this user',
            status: 'ok'
        };

        Saga.reload(); // BI decision to do this reload. Not possible to unlock a level without refresh of page at the moment
        //Saga.getGame().openNppDialogCallback(obj);
    };
	
	var refresh_page = function() {
		Saga.reload();
	};

     var requestBoosterWheelFromMany = function (title, message, externalUserIds, image) {
        var trackingType = "requestBoosterWheel";
        getRpc().remoteCall("CandyCrushAPI.getRequestBoosterWheelUrlMessage", [trackingType],
            function (urlMessage) {
                console.log("callback from CandyCrushAPI.getRequestBoosterWheelUrlMessage: result=", urlMessage);
                Saga.openRequestDialog(trackingType, title, message, image, 'invite', urlMessage, externalUserIds);
            },
            function (error) {
                console.log(error);
            }
        );
     };


     var acceptBoosterWheelHelp = function (title, message, toExternalUserId, image) {
         var trackingType = "acceptBoosterWheelHelp";
        getRpc().remoteCall("CandyCrushAPI.getGiveBoosterWheelHelpUrlMessage", [trackingType],
            function (urlMessage) {
                console.log("callback from CandyCrushAPI.getGiveBoosterWheelHelpUrlMessage: result=", urlMessage);
                Saga.openRequestDialog(trackingType, title, message, image, 'gift', urlMessage, [toExternalUserId]);
            },
            function (error) {
                console.log(error);
            }
         );
     };

    var reRequestUserDeniedCapability = function (capability, callback, errorCallback) {
        var capability2permission = {
            appFriends: "user_friends",
            invitableFriends: "user_friends",
            publishActions: "publish_actions"
        };
        try {
            var permission = capability2permission[capability];
            SocialChannels.reRequest(permission, function(response) {
                if (response.status == "success") {
                    if ($.inArray(permission, response.data) > -1) {
                        callback(true);
                    } else {
                        callback(false);
                    }
                } else {
                    errorCallback({status:"error",error:response.error});
                }
            });
        } catch (e) {
            console.log(e);
            reportError(e.message);
        }
    };

    return {
        init : init,
        setOpenGraphNppUrl : setOpenGraphNppUrl,
        giveBoosterToUsers : giveBoosterToUsers,
        getCandyProperties : getCandyProperties,
        setCandyProperty : setCandyProperty,
        getInvitableFriends: getInvitableFriends,
        openInviteFriendsDialog : openInviteFriendsDialog,
        notifyProductGiftToUser : notifyProductGiftToUser,
        isNppEligible : isNppEligible,
        openNppDialog : openNppDialog,
        npp_callback : npp_callback,
        requestBoosterWheelFromMany : requestBoosterWheelFromMany,
        acceptBoosterWheelHelp : acceptBoosterWheelHelp,
		refresh_page : refresh_page,
        sendSeasonalMessage: sendSeasonalMessage,
        reRequestUserDeniedCapability: reRequestUserDeniedCapability
    };
    
}();
