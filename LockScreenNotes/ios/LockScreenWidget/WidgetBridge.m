#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(WidgetBridge, RCTEventEmitter)
RCT_EXTERN_METHOD(setWidgetData:(NSString *)jsonString)
RCT_EXTERN_METHOD(reloadWidget)
@end
