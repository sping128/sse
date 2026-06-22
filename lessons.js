window.LESSONS = {

"architecture": {
  title: "Software Architecture",
  icon: "🏛️",
  xpMax: 300,
  sections: [
    {
      id: "what-is-architecture",
      title: "What is Architecture?",
      content: `
<p>Architecture is the set of decisions that are <strong>hard to reverse</strong>. Not the choice of variable name or which library to parse JSON — the decisions that, if you got wrong, would cost months to fix.</p>

<p>A senior engineer is defined by their ability to make those decisions <em>deliberately</em>, knowing the trade-offs, rather than by accident.</p>

<blockquote>"Architecture is what remains when you can't easily change it anymore."</blockquote>

<p>Think of it this way: when you join a bank codebase, the architecture is already there. Understanding it — why things are structured the way they are, what constraints shaped those decisions — is the first thing that separates a senior from a junior engineer.</p>
`
    },
    {
      id: "cohesion-coupling",
      title: "The Core Rule: Cohesion & Coupling",
      content: `
<p>Before any pattern, memorize this:</p>

<div class="callout">
  <strong>High cohesion within a component. Low coupling between components.</strong>
</div>

<ul>
  <li><strong>Cohesion</strong> — how focused a component's responsibilities are. A class that does one thing well has high cohesion.</li>
  <li><strong>Coupling</strong> — the degree of dependency between components. If changing A forces you to change B, they are tightly coupled.</li>
</ul>

<p>Every architectural pattern you'll ever learn exists primarily to <strong>reduce coupling</strong>. If you understand why coupling is bad, you can reason about any architecture without memorizing patterns.</p>

<h3>A Banking Example</h3>

<p>A junior engineer might write a loan approval service like this:</p>

<pre><code class="java">// ❌ Low cohesion + tight coupling
@Service
public class LoanService {
    public void approveLoan(Loan loan) {
        CreditScore score = creditBureau.check(loan.customerId());
        if (score.value() > 650) {
            loanRepository.save(loan.approve());
            emailService.sendApprovalEmail(loan);   // coupled to email
            smsService.sendApprovalSMS(loan);        // coupled to SMS
            auditLogger.log("LOAN_APPROVED", loan);  // coupled to audit
        }
    }
}</code></pre>

<p>Every new notification channel means changing <code>LoanService</code>. If <code>emailService</code> is down, loan approval fails entirely.</p>

<p>A senior engineer decouples it with an event:</p>

<pre><code class="java">// ✅ High cohesion + loose coupling
@Service
public class LoanService {
    public void approveLoan(Loan loan) {
        CreditScore score = creditBureau.check(loan.customerId());
        if (score.value() > 650) {
            loanRepository.save(loan.approve());
            eventPublisher.publish(new LoanApprovedEvent(loan)); // done
        }
    }
}

// Lives in its own class — LoanService doesn't know it exists
@EventListener
public class NotificationService {
    public void onLoanApproved(LoanApprovedEvent event) { ... }
}</code></pre>

<p>Now <code>NotificationService</code> can fail without taking down <code>LoanService</code>. Adding a push notification? New listener, zero changes to loan logic.</p>
`
    },
    {
      id: "architectural-styles",
      title: "Architectural Styles at a Bank",
      content: `
<p>An <strong>architectural style</strong> is the overall organizational pattern for a system. Banks rarely use just one — you'll see a mix depending on the age and purpose of each system.</p>

<table>
  <thead>
    <tr><th>Style</th><th>What it looks like</th><th>Why banks use it</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Layered Monolith</strong></td>
      <td>One deployable unit: Controller → Service → Repository</td>
      <td>Legacy core banking. Stable, auditable, simple to operate.</td>
    </tr>
    <tr>
      <td><strong>SOA</strong></td>
      <td>Services communicate via an Enterprise Service Bus (ESB)</td>
      <td>Large banks integrating mainframes, COBOL systems, and external partners.</td>
    </tr>
    <tr>
      <td><strong>Microservices</strong></td>
      <td>Small independent services, each owns its data</td>
      <td>Greenfield projects within the bank. Independent deployability.</td>
    </tr>
    <tr>
      <td><strong>Event-Driven</strong></td>
      <td>Services publish/consume events (Kafka, RabbitMQ)</td>
      <td>Fraud detection, transaction streaming, audit logs.</td>
    </tr>
  </tbody>
</table>

<div class="callout callout-info">
  <strong>Reality check:</strong> At a bank you will almost certainly work with a <em>mix</em>. The 40-year-old core ledger runs on a mainframe. The payments API is a Spring Boot monolith. The fraud detection pipeline is event-driven. Your job is to understand each piece and how they talk to each other.
</div>
`
    },
    {
      id: "layered-architecture",
      title: "The Layered Architecture",
      content: `
<p>This is the most common pattern you'll write Spring Boot code in day-to-day. Know it cold.</p>

<pre><code>┌─────────────────────────────────────┐
│  Presentation Layer                 │  ← @RestController  (Angular calls here)
├─────────────────────────────────────┤
│  Application / Service Layer        │  ← @Service         (business logic)
├─────────────────────────────────────┤
│  Domain Layer                       │  ← POJOs, Entities  (the real rules)
├─────────────────────────────────────┤
│  Infrastructure / Data Layer        │  ← @Repository, JPA (DB, external APIs)
└─────────────────────────────────────┘</code></pre>

<h3>The Cardinal Rule</h3>
<p>Dependencies only flow <strong>downward</strong>. Your <code>@Service</code> can call a <code>@Repository</code>. Your <code>@Repository</code> must never call a <code>@Service</code>. Violating this creates circular dependencies and logic that's impossible to test in isolation.</p>

<h3>Why the Domain Layer Matters at a Bank</h3>
<p>In banking, the Domain Layer is where auditors look. It contains the business rules: interest calculations, account limits, transaction validation. These must be <strong>pure Java with no framework dependencies</strong> so they can be tested and audited without spinning up a Spring container.</p>

<pre><code class="java">// Domain object — no @Service, no @Repository, no Spring annotations
public class LoanApplication {
    public boolean isEligible(CreditScore score, Income income) {
        return score.value() >= 650 && income.monthly().compareTo(MIN_INCOME) > 0;
    }
}

// Service layer orchestrates
@Service
public class LoanService {
    public Result apply(LoanRequest req) {
        var app = new LoanApplication(req); // domain object
        if (app.isEligible(score, income)) {
            loanRepository.save(app.approve());
        }
    }
}</code></pre>
`
    },
    {
      id: "quality-attributes",
      title: "Quality Attributes",
      content: `
<p>Every architecture is optimizing for something. At a bank, the priorities are very different from a startup.</p>

<table>
  <thead>
    <tr><th>Attribute</th><th>Bank priority</th><th>Why</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Reliability</strong></td><td>🔴 Critical</td><td>A failed or double-processed payment is a regulatory and reputational disaster.</td></tr>
    <tr><td><strong>Security</strong></td><td>🔴 Critical</td><td>PCI-DSS, data protection laws, fraud risk. Non-negotiable.</td></tr>
    <tr><td><strong>Auditability</strong></td><td>🔴 Critical</td><td>Every transaction must have a complete, tamper-proof trail.</td></tr>
    <tr><td><strong>Availability</strong></td><td>🟠 High</td><td>Core banking downtime = customers can't pay rent or make transfers.</td></tr>
    <tr><td><strong>Scalability</strong></td><td>🟡 Medium</td><td>Banks have predictable load (month-end spikes, not viral growth).</td></tr>
    <tr><td><strong>Developer velocity</strong></td><td>🟡 Medium</td><td>Stability beats speed. Change management processes are strict.</td></tr>
  </tbody>
</table>

<h3>Availability Numbers</h3>
<p>When someone says "we need five nines," here's what that means:</p>

<table>
  <thead>
    <tr><th>SLA</th><th>Downtime per year</th><th>Downtime per month</th></tr>
  </thead>
  <tbody>
    <tr><td>99%</td><td>3.65 days</td><td>7.2 hours</td></tr>
    <tr><td>99.9%</td><td>8.7 hours</td><td>43 minutes</td></tr>
    <tr><td>99.99%</td><td>52 minutes</td><td>4.3 minutes</td></tr>
    <tr><td>99.999%</td><td>5.2 minutes</td><td>26 seconds</td></tr>
  </tbody>
</table>

<div class="callout callout-warning">
  Quality attributes often <strong>conflict</strong>. Maximizing availability costs money. High security can hurt performance. Adding auditability adds latency. Your job as a senior engineer is to <em>prioritize</em> them for your specific context — and document why.
</div>
`
    },
    {
      id: "tradeoff-mindset",
      title: "The Trade-Off Mindset",
      content: `
<p>This is the most important thing in this entire lesson:</p>

<blockquote>"It depends" is the correct answer — as long as you can finish the sentence.</blockquote>

<p>Senior engineers don't pick patterns from a checklist. They pick based on <strong>context + constraints + consequences</strong>.</p>

<h3>The ADR (Architecture Decision Record)</h3>
<p>Every significant architectural decision should be documented in an ADR. It's a short file that captures:</p>

<ol>
  <li><strong>Context</strong> — what situation are we in?</li>
  <li><strong>Decision</strong> — what did we decide?</li>
  <li><strong>Options considered</strong> — what else did we evaluate?</li>
  <li><strong>Consequences</strong> — what are the trade-offs we're accepting?</li>
</ol>

<p>Banks care about ADRs because auditors and regulators ask why decisions were made. "We thought it was a good idea" is not an acceptable answer. "We chose the layered monolith over microservices because our team of 6 lacked the operational maturity to manage distributed tracing and independent deployments at this stage" — that's an answer.</p>

<h3>Common Trap: Cargo Culting</h3>
<p>"Netflix uses microservices" is not a reason to use microservices. Netflix has thousands of engineers, years of investment in tooling, and a fundamentally different scale problem. Adopting their architecture without their constraints is <strong>cargo culting</strong> — copying the form without understanding the function.</p>

<p>Always ask: <em>What specific problem am I solving? Does this pattern solve that problem in my context?</em></p>
`
    },
    {
      id: "solid",
      title: "SOLID Principles",
      content: `
<p>Five principles that, together, push you toward low coupling and high cohesion. A senior engineer who knows SOLID can evaluate any codebase — because the reasoning transfers to every language and framework.</p>

<h3>S — Single Responsibility Principle</h3>
<div class="callout">A class should have only one reason to change.</div>

<p>"One reason to change" means one stakeholder, one concern. If your class changes when the business rule changes <em>and</em> when the database schema changes <em>and</em> when the notification format changes — it has three responsibilities.</p>

<pre><code>// ❌ Four reasons to change: limit rules, DB schema, email template, audit format
@Service
public class AccountService {
    public void transfer(Transfer t) {
        if (t.amount().compareTo(DAILY_LIMIT) > 0) throw new LimitExceededException();
        accountRepository.debit(t.from(), t.amount());
        accountRepository.credit(t.to(), t.amount());
        String body = "Dear " + t.from().name() + ", your transfer of $" + t.amount() + "...";
        emailClient.send(t.from().email(), body);
        auditLog.write("[TRANSFER] " + t.from() + " -> " + t.to());
    }
}</code></pre>

<pre><code>// ✅ Each class has one reason to change
@Service
public class TransferService {
    public void transfer(Transfer t) {
        transferValidator.validate(t);
        accountRepository.debit(t.from(), t.amount());
        accountRepository.credit(t.to(), t.amount());
        eventPublisher.publish(new TransferCompletedEvent(t));
    }
}

@EventListener class NotificationService { ... }  // only notifications
@EventListener class AuditService         { ... }  // only audit</code></pre>

<h3>O — Open/Closed Principle</h3>
<div class="callout">Open for extension, closed for modification.</div>

<p>Add new behavior without editing existing, working code. In Spring Boot this appears as <strong>strategy injection</strong>.</p>

<pre><code>// ❌ Every new fee type = edit this method
public BigDecimal calculateFee(Transaction t) {
    if (t.type() == DOMESTIC)      return t.amount().multiply(new BigDecimal("0.001"));
    if (t.type() == INTERNATIONAL) return t.amount().multiply(new BigDecimal("0.025"));
}

// ✅ New fee type = new class, zero edits to existing code
public interface FeeStrategy {
    BigDecimal calculate(Transaction t);
}

@Component("DOMESTIC")      class DomesticFeeStrategy     implements FeeStrategy { ... }
@Component("INTERNATIONAL") class InternationalFeeStrategy implements FeeStrategy { ... }

@Service
public class FeeService {
    private final Map&lt;String, FeeStrategy&gt; strategies; // Spring injects all
    public BigDecimal calculateFee(Transaction t) {
        return strategies.get(t.type().name()).calculate(t);
    }
}</code></pre>

<h3>L — Liskov Substitution Principle</h3>
<div class="callout">Subtypes must be substitutable for their parent types without breaking the program.</div>

<p>If a method accepts a <code>BankAccount</code>, it must work correctly with <em>any</em> subclass — <code>SavingsAccount</code>, <code>CurrentAccount</code>, <code>FixedDepositAccount</code> — without the caller checking which one it got.</p>

<pre><code>// ❌ LSP violation — caller is forced to know the concrete type
if (account instanceof SavingsAccount sa) {
    sa.applyInterest();
}

// ✅ Caller doesn't care what subtype it is
account.applyPeriodEndProcessing(); // each subtype implements it correctly</code></pre>

<p>If you find yourself writing <code>instanceof</code> checks in business logic, the type hierarchy is probably wrong.</p>

<h3>I — Interface Segregation Principle</h3>
<div class="callout">Clients should not be forced to depend on methods they don't use.</div>

<pre><code>// ❌ One fat interface forces every implementor to stub unused methods
public interface AccountOperations {
    void deposit(BigDecimal amount);
    void withdraw(BigDecimal amount);
    void applyInterest();      // only savings accounts
    void processOverdraft();   // only current accounts
    void lockForFixedTerm();   // only fixed deposit accounts
}

// ✅ Small focused interfaces — each class implements only what makes sense
public interface Depositable    { void deposit(BigDecimal amount); }
public interface Withdrawable   { void withdraw(BigDecimal amount); }
public interface InterestBearing { void applyInterest(); }

class SavingsAccount      implements Depositable, Withdrawable, InterestBearing { ... }
class FixedDepositAccount implements Depositable, InterestBearing { ... }</code></pre>

<h3>D — Dependency Inversion Principle</h3>
<div class="callout">High-level modules should not depend on low-level modules. Both should depend on abstractions.</div>

<p>This is the principle Spring Boot is <em>built around</em>. Spring's dependency injection exists specifically to implement DIP.</p>

<pre><code>// ❌ High-level service hardcoded to a specific low-level implementation
@Service
public class LoanService {
    private final MySQLLoanRepository repo = new MySQLLoanRepository();
}

// ✅ Depends on abstraction — Spring injects whatever implements it
@Service
public class LoanService {
    private final LoanRepository repo; // interface

    public LoanService(LoanRepository repo) { this.repo = repo; }
    // swap to InMemoryLoanRepository in tests — zero changes here
}</code></pre>
`
    },
    {
      id: "dry-kiss-yagni",
      title: "DRY, KISS & YAGNI",
      content: `
<p>Three principles senior engineers use to <strong>resist over-engineering</strong>.</p>

<table>
  <thead>
    <tr><th>Principle</th><th>Rule</th><th>Common violation</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>DRY</strong><br><small>Don't Repeat Yourself</small></td>
      <td>Every piece of knowledge has one authoritative source</td>
      <td>Copy-pasting validation logic across 5 controllers</td>
    </tr>
    <tr>
      <td><strong>KISS</strong><br><small>Keep It Simple</small></td>
      <td>Prefer the simpler solution until complexity is justified by evidence</td>
      <td>Using CQRS + Event Sourcing for a 3-table CRUD app</td>
    </tr>
    <tr>
      <td><strong>YAGNI</strong><br><small>You Aren't Gonna Need It</small></td>
      <td>Don't build for hypothetical future requirements</td>
      <td>Adding a plugin system "in case we need it someday"</td>
    </tr>
  </tbody>
</table>

<div class="callout callout-warning">
  <strong>At a bank, YAGNI is especially important.</strong> Banks have strict change management. Every line of code is a line someone must review, test, deploy, and maintain in a regulated environment. Unnecessary complexity is a liability — not a feature.
</div>

<h3>How SOLID Connects to Architecture</h3>
<p>SOLID operates at the class level, but it expresses the same instinct as architectural principles:</p>

<ul>
  <li><strong>SRP</strong> → high cohesion</li>
  <li><strong>OCP</strong> → extensible without touching existing code</li>
  <li><strong>DIP</strong> → depend on abstractions (Spring IoC makes this easy)</li>
</ul>

<p>When you review code at your bank job, you'll encounter violations of these constantly. Naming them gives you the vocabulary to explain <em>why</em> something is wrong — not just that it <em>feels</em> wrong. That's what separates a senior engineer's feedback from a junior engineer's.</p>
`
    }
  ]
},

"system-design": {
  title: "System Design",
  icon: "⚙️",
  xpMax: 400,
  sections: [
    {
      id: "what-is-system-design",
      title: "What is System Design?",
      content: `
<p>System design is the process of defining <strong>how components work together at scale</strong> — across machines, processes, and time. Where architecture answers "how should this service be structured?", system design answers "how do ten services serve ten million users without falling over?"</p>

<p>Senior engineers are expected to reason about systems they haven't built yet. Given a requirement like "design a payment processing system for 1 million daily transactions," you need a structured way to think through it.</p>

<h3>The Design Process</h3>

<p>Always start by asking clarifying questions before drawing boxes. A common trap: jumping to a solution before understanding the problem.</p>

<ol>
  <li><strong>Clarify requirements</strong> — What's the scale? Read-heavy or write-heavy? Strong consistency required, or eventual is fine?</li>
  <li><strong>Estimate scale</strong> — Rough numbers. 1M daily users ≈ ~12 requests/sec average, but peak may be 10×.</li>
  <li><strong>Define the API</strong> — What does the system expose? Input/output shapes anchor the design.</li>
  <li><strong>Design the data model</strong> — What needs to be stored? What are the access patterns?</li>
  <li><strong>Sketch the high-level design</strong> — Services, databases, queues. Keep it simple first.</li>
  <li><strong>Identify bottlenecks</strong> — Where does this break at 10× load? Then add complexity only where needed.</li>
</ol>

<div class="callout">
  <strong>Rule:</strong> Start simple. Add complexity only when you can name the specific problem it solves.
</div>
`
    },
    {
      id: "scalability",
      title: "Scalability: Vertical vs Horizontal",
      content: `
<p>When a system can't handle more load, you have two levers:</p>

<ul>
  <li><strong>Vertical scaling (scale up)</strong> — Give the existing machine more CPU, RAM, or disk. Simple, but has a hard ceiling and a single point of failure.</li>
  <li><strong>Horizontal scaling (scale out)</strong> — Add more machines running the same service. No hard ceiling, but requires your application to be <em>stateless</em>.</li>
</ul>

<h3>Stateless vs Stateful Services</h3>

<p>This is the key constraint. To scale horizontally, each instance must produce the same result for the same request regardless of which instance handles it. If a service stores session state in memory, requests must always route to the same instance — that's sticky sessions, and it's a scaling headache.</p>

<p>The fix: move state out of the application and into a shared store.</p>

<pre><code class="java">// ❌ Stateful — can't scale out freely
@RestController
public class SessionController {
    private Map&lt;String, User&gt; sessions = new HashMap&lt;&gt;(); // in-memory

    @GetMapping("/me")
    public User getUser(HttpServletRequest req) {
        return sessions.get(req.getSession().getId());
    }
}

// ✅ Stateless — any instance can handle any request
@RestController
public class SessionController {
    @Autowired RedisTemplate&lt;String, User&gt; redis;

    @GetMapping("/me")
    public User getUser(@RequestHeader("Authorization") String token) {
        return redis.opsForValue().get(parseUserId(token)); // shared state in Redis
    }
}</code></pre>

<h3>Banking Example</h3>

<p>A bank's account inquiry service is read-heavy and naturally stateless — any instance can look up a balance. But a funds transfer service that checks-and-debits in two steps must handle concurrency carefully. Horizontal scaling doesn't eliminate the need for correct locking at the database level.</p>
`
    },
    {
      id: "caching",
      title: "Caching",
      content: `
<p>Caching is storing the result of an expensive operation so you don't repeat it. It's one of the highest-leverage tools in system design — and one of the most dangerous if misused.</p>

<h3>Where to Cache</h3>

<ul>
  <li><strong>Client-side</strong> — Browser cache, HTTP Cache-Control headers. Free performance for static assets.</li>
  <li><strong>CDN</strong> — Cache at the network edge, close to users. Good for read-heavy public content.</li>
  <li><strong>Application cache</strong> — In-process (e.g., Guava Cache) or distributed (e.g., Redis). Most common for database query results.</li>
  <li><strong>Database cache</strong> — Query result cache, buffer pool. Happens automatically but you can tune it.</li>
</ul>

<h3>Cache Invalidation Strategies</h3>

<p>The hard part of caching isn't storing data — it's knowing when to remove it.</p>

<ul>
  <li><strong>TTL (Time-to-Live)</strong> — Expire entries after N seconds. Simple, but you may serve stale data up to TTL.</li>
  <li><strong>Write-through</strong> — Update the cache every time you write to the DB. Cache always fresh, but adds write latency.</li>
  <li><strong>Cache-aside (lazy loading)</strong> — Read from cache; on miss, load from DB and populate cache. Most common pattern.</li>
  <li><strong>Invalidate on write</strong> — Delete the cache entry when the underlying data changes. Simple but creates a thundering herd if many requests race to repopulate.</li>
</ul>

<pre><code class="java">// Cache-aside pattern (most common)
public AccountBalance getBalance(String accountId) {
    AccountBalance cached = redis.opsForValue().get("balance:" + accountId);
    if (cached != null) return cached;

    AccountBalance fresh = accountRepository.findById(accountId).getBalance();
    redis.opsForValue().set("balance:" + accountId, fresh, Duration.ofSeconds(30));
    return fresh;
}</code></pre>

<div class="callout">
  <strong>Banking caveat:</strong> Account balances require strong consistency. Cache only for read-heavy, tolerance-for-slight-staleness scenarios (e.g., displaying a recent transaction list). Never cache a balance you're using to authorize a debit.
</div>
`
    },
    {
      id: "load-balancing",
      title: "Load Balancing & API Gateways",
      content: `
<p>Once you have multiple instances of a service, something must decide which instance handles each request. That's a <strong>load balancer</strong>.</p>

<h3>Load Balancing Algorithms</h3>

<ul>
  <li><strong>Round robin</strong> — Requests distributed in order: instance 1, 2, 3, 1, 2, 3... Simple and effective when instances are equal.</li>
  <li><strong>Least connections</strong> — Route to the instance with fewest active connections. Better when requests vary in processing time.</li>
  <li><strong>IP hash</strong> — Same client IP always routes to the same instance. Useful for sticky sessions (but try to avoid needing this).</li>
  <li><strong>Weighted</strong> — Send more traffic to more powerful instances.</li>
</ul>

<h3>API Gateway</h3>

<p>In microservice architectures, an API gateway sits in front of all services and handles cross-cutting concerns:</p>

<ul>
  <li>Authentication / JWT validation</li>
  <li>Rate limiting</li>
  <li>Request routing</li>
  <li>SSL termination</li>
  <li>Logging and tracing</li>
</ul>

<p>This keeps each individual service from having to implement these concerns. In a bank, the gateway enforces that every request carries a valid token before it ever reaches the payment service.</p>

<pre><code>
  Client
    │
    ▼
[API Gateway]  ← auth, rate-limit, routing
    │
    ├──► [Account Service]
    ├──► [Payment Service]
    └──► [Notification Service]
</code></pre>

<h3>Health Checks</h3>

<p>Load balancers need to know which instances are healthy. Services expose a <code>/health</code> endpoint; the load balancer polls it and stops routing to instances that fail. In Spring Boot, Spring Actuator gives you this for free at <code>/actuator/health</code>.</p>
`
    },
    {
      id: "reliability",
      title: "Reliability & Fault Tolerance",
      content: `
<p>At scale, failures are not exceptional — they are routine. A senior engineer designs systems that degrade gracefully rather than fail completely.</p>

<h3>Key Reliability Concepts</h3>

<p><strong>Single Point of Failure (SPOF)</strong> — Any component whose failure brings down the whole system. Eliminate them with redundancy: run multiple instances, use replicated databases, deploy across availability zones.</p>

<p><strong>Failover</strong> — When the primary fails, traffic automatically switches to a standby. A primary-replica database setup allows read traffic to continue from replicas if the primary goes down.</p>

<p><strong>Circuit Breaker</strong> — If a downstream service is failing, stop hammering it with requests. After N consecutive failures, "open" the circuit and return a fallback immediately. After a timeout, allow a probe request through ("half-open"). This prevents cascading failures.</p>

<pre><code class="java">// Resilience4j circuit breaker (common in Spring Boot)
@CircuitBreaker(name = "creditScoreService", fallbackMethod = "defaultScore")
public CreditScore getCreditScore(String customerId) {
    return creditBureauClient.check(customerId);
}

public CreditScore defaultScore(String customerId, Exception ex) {
    // Return a conservative default instead of crashing
    return CreditScore.conservative();
}</code></pre>

<p><strong>Retry with backoff</strong> — Transient failures (network blip, temporary overload) often resolve on retry. But don't retry immediately in a tight loop — use exponential backoff to avoid making an overloaded service worse.</p>

<p><strong>Idempotency</strong> — In banking this is critical. If a "transfer $100" request times out, did it execute? The client retries — will the customer be charged twice? Design operations to be idempotent: a retry with the same idempotency key produces the same result without double-executing.</p>

<pre><code class="java">// Idempotent payment endpoint
@PostMapping("/payments")
public PaymentResult createPayment(
    @RequestHeader("Idempotency-Key") String key,
    @RequestBody PaymentRequest req) {

    // Return existing result if this key was already processed
    return paymentService.processIdempotent(key, req);
}</code></pre>

<div class="callout">
  <strong>The key mindset shift:</strong> Stop asking "what happens when everything works?" Start asking "what happens when this specific component fails?" Design the answer before it happens in production.
</div>
`
    }
  ]
},

"design-patterns": {
  title: "Design Patterns",
  icon: "🧩",
  xpMax: 350,
  sections: [
    {
      id: "what-are-patterns",
      title: "What Are Design Patterns?",
      content: `
<p>Design patterns are <strong>named solutions to recurring problems</strong>. They're not libraries you import — they're vocabulary for communicating structure. When a senior engineer says "use a Strategy here," everyone on the team immediately understands the shape of the solution.</p>

<p>The classic reference is the <em>Gang of Four</em> book (1994), which organized 23 patterns into three categories:</p>

<ul>
  <li><strong>Creational</strong> — how objects are created (Builder, Factory, Singleton)</li>
  <li><strong>Structural</strong> — how objects are composed (Decorator, Facade, Adapter)</li>
  <li><strong>Behavioral</strong> — how objects communicate (Strategy, Observer, Command)</li>
</ul>

<div class="callout">
  <strong>The trap:</strong> Pattern overuse. Applying a pattern where a simple function would do is an antipattern in itself. Use patterns when you can name the specific problem they solve, not to appear sophisticated.
</div>

<p>In a Spring Boot codebase, you are already using patterns constantly — Spring's own framework is built on them. The goal here is to recognize them, name them, and know when to reach for them yourself.</p>
`
    },
    {
      id: "strategy-pattern",
      title: "Strategy Pattern",
      content: `
<p>The Strategy pattern defines a <strong>family of interchangeable algorithms</strong> and lets you swap them at runtime without changing the code that uses them. It's one of the most useful patterns in business applications.</p>

<h3>The Problem</h3>

<p>A bank charges different fees depending on account type: premium accounts pay 0.1%, standard accounts pay 0.5%, student accounts pay nothing. Without Strategy:</p>

<pre><code class="java">// ❌ Every new account type requires modifying this method
public BigDecimal calculateFee(Transaction tx, String accountType) {
    if (accountType.equals("PREMIUM")) return tx.amount().multiply(new BigDecimal("0.001"));
    if (accountType.equals("STANDARD")) return tx.amount().multiply(new BigDecimal("0.005"));
    if (accountType.equals("STUDENT")) return BigDecimal.ZERO;
    throw new IllegalArgumentException("Unknown type");
}</code></pre>

<h3>With Strategy</h3>

<pre><code class="java">// ✅ Adding a new account type = new class, zero changes to existing code
public interface FeeStrategy {
    BigDecimal calculate(Transaction tx);
}

@Component("PREMIUM")
public class PremiumFeeStrategy implements FeeStrategy {
    public BigDecimal calculate(Transaction tx) {
        return tx.amount().multiply(new BigDecimal("0.001"));
    }
}

@Component("STUDENT")
public class StudentFeeStrategy implements FeeStrategy {
    public BigDecimal calculate(Transaction tx) { return BigDecimal.ZERO; }
}

@Service
public class FeeService {
    @Autowired Map&lt;String, FeeStrategy&gt; strategies; // Spring injects all implementations

    public BigDecimal calculateFee(Transaction tx, String accountType) {
        return strategies.get(accountType).calculate(tx);
    }
}</code></pre>

<p>Spring's ability to inject all implementations of an interface into a Map makes Strategy particularly clean in Java. Adding a new account type is a new class — nothing else changes.</p>

<p>This is also a direct application of the <strong>Open/Closed Principle</strong>: open for extension, closed for modification.</p>
`
    },
    {
      id: "builder-pattern",
      title: "Builder Pattern",
      content: `
<p>The Builder pattern constructs <strong>complex objects step by step</strong>, separating construction from representation. You use it constantly in Java, often without realizing it.</p>

<h3>The Problem It Solves</h3>

<p>A <code>TransferRequest</code> object has 8 fields. Some are optional. A constructor with 8 parameters is unreadable and error-prone — did you put amount before currency or after?</p>

<pre><code class="java">// ❌ Telescoping constructor — which arg is which?
new TransferRequest("ACC001", "ACC002", new BigDecimal("1000"), "GBP", true, null, "REF-123", Instant.now());</code></pre>

<h3>With Builder</h3>

<pre><code class="java">// ✅ Readable, self-documenting, optional fields handled cleanly
TransferRequest request = TransferRequest.builder()
    .fromAccount("ACC001")
    .toAccount("ACC002")
    .amount(new BigDecimal("1000"))
    .currency("GBP")
    .urgent(true)
    .reference("REF-123")
    .build();
</code></pre>

<p>In modern Java projects, <strong>Lombok's <code>@Builder</code></strong> generates this for you:</p>

<pre><code class="java">@Builder
@Value // immutable
public class TransferRequest {
    String fromAccount;
    String toAccount;
    BigDecimal amount;
    String currency;
    boolean urgent;
    String note;      // optional — defaults to null
    String reference;
    Instant requestedAt;
}</code></pre>

<h3>You Use It Everywhere Already</h3>

<ul>
  <li><code>HttpRequest.newBuilder()...build()</code></li>
  <li><code>ResponseEntity.ok().header(...).body(...)</code></li>
  <li>Spring Security's <code>http.authorizeRequests()...build()</code></li>
  <li>JPA's <code>CriteriaBuilder</code></li>
</ul>

<p>Recognize the pattern in unfamiliar APIs — chained method calls returning <code>this</code>, terminated by <code>build()</code> — and you'll read new libraries faster.</p>
`
    },
    {
      id: "decorator-pattern",
      title: "Decorator Pattern",
      content: `
<p>The Decorator pattern <strong>wraps an object to add behaviour without changing the original class</strong>. It's the structural backbone of AOP (Aspect-Oriented Programming), which Spring uses extensively.</p>

<h3>Manual Decorator</h3>

<p>You have a <code>PaymentService</code>. You want to add logging and timing without touching the service itself:</p>

<pre><code class="java">public interface PaymentService {
    PaymentResult process(PaymentRequest req);
}

@Primary
@Service
public class LoggingPaymentService implements PaymentService {
    private final PaymentService delegate; // wraps the real service
    private final Logger log = LoggerFactory.getLogger(getClass());

    public LoggingPaymentService(@Qualifier("realPaymentService") PaymentService delegate) {
        this.delegate = delegate;
    }

    public PaymentResult process(PaymentRequest req) {
        log.info("Processing payment {}", req.reference());
        long start = System.currentTimeMillis();
        PaymentResult result = delegate.process(req); // delegate to original
        log.info("Completed in {}ms", System.currentTimeMillis() - start);
        return result;
    }
}</code></pre>

<h3>Spring AOP = Decorator Under the Hood</h3>

<p>When you write <code>@Transactional</code> or <code>@Cacheable</code>, Spring wraps your bean in a proxy that adds that behaviour. You never see the wrapper, but it's a decorator.</p>

<pre><code class="java">@Service
public class AccountService {

    @Transactional          // Spring wraps this method in a transaction decorator
    @Cacheable("accounts")  // and a caching decorator
    public Account findById(String id) {
        return accountRepository.findById(id).orElseThrow();
    }
}</code></pre>

<div class="callout">
  <strong>Key insight:</strong> Every time you add a Spring annotation that changes behaviour without modifying logic (<code>@Transactional</code>, <code>@Cacheable</code>, <code>@Secured</code>, <code>@Retryable</code>), you are using the Decorator pattern via AOP. Understanding this makes Spring's proxy model far less mysterious.
</div>
`
    },
    {
      id: "facade-pattern",
      title: "Facade Pattern",
      content: `
<p>The Facade pattern provides a <strong>simplified interface to a complex subsystem</strong>. Rather than callers knowing about 5 internal services, they interact with one surface that orchestrates them.</p>

<h3>Banking Example</h3>

<p>Opening a new bank account involves: KYC verification, credit check, account creation, welcome notification, and audit logging. Without a facade, the controller knows about all of it:</p>

<pre><code class="java">// ❌ Controller doing too much orchestration
@PostMapping("/accounts")
public Account openAccount(@RequestBody NewAccountRequest req) {
    kycService.verify(req.customerId());
    CreditScore score = creditService.check(req.customerId());
    Account account = accountRepository.create(req, score);
    notificationService.sendWelcome(account);
    auditService.log("ACCOUNT_OPENED", account);
    return account;
}</code></pre>

<pre><code class="java">// ✅ Facade hides the complexity
@PostMapping("/accounts")
public Account openAccount(@RequestBody NewAccountRequest req) {
    return accountOpeningFacade.open(req); // single call
}

@Service
public class AccountOpeningFacade {
    public Account open(NewAccountRequest req) {
        kycService.verify(req.customerId());
        CreditScore score = creditService.check(req.customerId());
        Account account = accountRepository.create(req, score);
        notificationService.sendWelcome(account);
        auditService.log("ACCOUNT_OPENED", account);
        return account;
    }
}</code></pre>

<p>The controller is now trivially testable. The orchestration logic lives in one place. If the account-opening process changes, you update the facade — not every controller that participates in it.</p>

<h3>Facade vs Service Layer</h3>

<p>In Spring Boot, your <code>@Service</code> classes often <em>are</em> facades — they hide repository and domain complexity from controllers. The distinction matters when a service grows too large: split the internal complexity into focused sub-services, then keep the facade as the public entry point.</p>

<div class="callout">
  <strong>Recognizing the pattern in code reviews:</strong> If a controller method is longer than ~10 lines and calls more than 2–3 services, it's probably missing a facade. Extract the orchestration.
</div>
`
    }
  ]
}

};
