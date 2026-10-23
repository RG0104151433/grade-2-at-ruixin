#include <bits/stdc++.h>
using namespace std;

struct CalcError {
    bool divide0;
    CalcError(bool d = false) : divide0(d) {}
};

class Parser {
private:
    string s;
    int pos;

    void skip() {
        while (pos < (int)s.size() && isspace((unsigned char)s[pos])) pos++;
    }

    long long parseNumber() {
        skip();
        if (pos >= (int)s.size() || !isdigit((unsigned char)s[pos]))
            throw CalcError(false);

        long long val = 0;
        while (pos < (int)s.size() && isdigit((unsigned char)s[pos])) {
            val = val * 10 + (s[pos] - '0');
            pos++;
        }
        return val;
    }

    long long parsePrimary() {
        skip();

        if (pos < (int)s.size() && s[pos] == '(') {
            pos++;
            long long v = parseExpression();
            skip();

            if (pos >= (int)s.size() || s[pos] != ')')
                throw CalcError(false);

            pos++;
            return v;
        }

        return parseNumber();
    }

    long long fastPow(long long base, long long exp) {
        long long res = 1;
        while (exp > 0) {
            if (exp & 1) res *= base;
            base *= base;
            exp >>= 1;
        }
        return res;
    }

    long long parsePower() {
        long long left = parsePrimary();
        skip();

        if (pos < (int)s.size() && s[pos] == '^') {
            pos++;
            long long right = parseUnary(); // ÃÝÔËËãÓÒ½áºÏ

            if (right < 0)
                throw CalcError(false);

            return fastPow(left, right);
        }

        return left;
    }

    long long parseUnary() {
        skip();

        if (pos < (int)s.size() && s[pos] == '-') {
            pos++;
            return -parseUnary();
        }

        return parsePower();
    }

    long long parseTerm() {
        long long v = parseUnary();

        while (true) {
            skip();

            if (pos < (int)s.size() &&
                (s[pos] == '*' || s[pos] == '/' || s[pos] == '%')) {

                char op = s[pos++];
                long long rhs = parseUnary();

                if (op == '*') {
                    v *= rhs;
                } else if (op == '/') {
                    if (rhs == 0) throw CalcError(true);
                    v /= rhs;
                } else {
                    if (rhs == 0) throw CalcError(true);
                    v %= rhs;
                }
            } else {
                break;
            }
        }

        return v;
    }

    long long parseExpression() {
        long long v = parseTerm();

        while (true) {
            skip();

            if (pos < (int)s.size() && (s[pos] == '+' || s[pos] == '-')) {
                char op = s[pos++];
                long long rhs = parseTerm();

                if (op == '+') v += rhs;
                else v -= rhs;
            } else {
                break;
            }
        }

        return v;
    }

public:
    Parser(const string& str) : s(str), pos(0) {}

    long long parse() {
        long long ans = parseExpression();
        skip();

        if (pos != (int)s.size())
            throw CalcError(false);

        return ans;
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int N;
    cin >> N;
    cin.ignore(numeric_limits<streamsize>::max(), '\n');

    while (N--) {
        string line;
        getline(cin, line);

        try {
            Parser parser(line);
            long long ans = parser.parse();
            cout << ans << '\n';
        } catch (CalcError& e) {
            if (e.divide0) cout << "Divide 0\n";
            else cout << "error\n";
        }
    }

    return 0;
}
