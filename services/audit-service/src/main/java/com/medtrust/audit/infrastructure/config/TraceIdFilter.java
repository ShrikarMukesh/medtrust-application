package com.medtrust.audit.infrastructure.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

/**
 * Filter that attaches a distributed trace ID to every incoming request in audit-service.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class TraceIdFilter implements Filter {

    public static final String TRACE_HEADER = "X-Trace-Id";
    public static final String MDC_TRACE_KEY = "traceId";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        try {
            if (request instanceof HttpServletRequest httpRequest && response instanceof HttpServletResponse httpResponse) {
                String traceId = httpRequest.getHeader(TRACE_HEADER);
                if (traceId == null || traceId.isBlank()) {
                    traceId = UUID.randomUUID().toString();
                }

                MDC.put(MDC_TRACE_KEY, traceId);
                httpResponse.setHeader(TRACE_HEADER, traceId);
            }

            chain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_TRACE_KEY);
        }
    }
}
