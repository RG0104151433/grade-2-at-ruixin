#include <stdio.h>
#include <ctype.h>

typedef long long ll;

/* 快速读入整数 */
int readInt() {
    int x = 0, f = 1;
    char ch = getchar();
    while (!isdigit(ch)) {
        if (ch == '-') f = -1;
        ch = getchar();
    }
    while (isdigit(ch)) {
        x = x * 10 + ch - '0';
        ch = getchar();
    }
    return x * f;
}

/* 快速读入长整型 */
ll readLongLong() {
    ll x = 0, f = 1;
    char ch = getchar();
    while (!isdigit(ch)) {
        if (ch == '-') f = -1;
        ch = getchar();
    }
    while (isdigit(ch)) {
        x = x * 10 + ch - '0';
        ch = getchar();
    }
    return x * f;
}

int main() {
    int T = readInt();
    while (T--) {
        int n = readInt();
        ll cur = readLongLong();  // 当前第一个灵珠的值
        ll sum = 0;
        for (int i = 2; i <= n; i++) {
            ll x = readLongLong(); // 当前第二个灵珠的值
            if (x > 0) {
                sum += x;          // 收走第二个灵珠
            } else {
                cur = x;           // 销毁第一个灵珠，第二个成为新的第一个
            }
        }
        printf("%lld\n", sum);
    }
    return 0;
}
