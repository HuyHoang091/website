package com.game.Config;

import com.corundumstudio.socketio.listener.ExceptionListenerAdapter;
import io.netty.channel.ChannelHandlerContext;
import java.net.SocketException;

public class SilentExceptionListener extends ExceptionListenerAdapter {

    @Override
    public boolean exceptionCaught(ChannelHandlerContext ctx, Throwable e) throws Exception {
        if (e instanceof SocketException && e.getMessage().contains("Connection reset")) {
            return true;
        }
        return super.exceptionCaught(ctx, e);
    }
}