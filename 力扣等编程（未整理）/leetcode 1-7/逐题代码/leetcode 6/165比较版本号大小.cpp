class Solution {
public:
    int compareVersion(string version1, string version2) {
        int v1=0,v2=0,p1=0,p2=0;
        vector<int> n1;
        vector<int> n2;
        while (v1<version1.size()) {
            while (v1<version1.size() && version1[v1]!='.') v1++;
            int c1=0;
            for (int i=p1;i<v1;i++) c1=10*c1+(version1[i]-'0');
            v1++;
            p1=v1;
            n1.emplace_back(c1);
        }
        while (v2<version2.size()) {
            while (v2<version2.size() && version2[v2]!='.') v2++;
            int c2=0;
            for (int i=p2;i<v2;i++) c2=10*c2+(version2[i]-'0');
            v2++;
            p2=v2;
            n2.emplace_back(c2);
        }
        int c1=0,c2=0;
        int l=min(n1.size(),n2.size());
        for (int i=0;i<l;i++) {
            if (n1[i]==n2[i]) continue;
            else if (n1[i]>n2[i]) return 1;
            else return -1;
        }
        if (n1.size()==n2.size()) return 0;
        else if (n1.size()>n2.size()) {
            for (int i=l;i<n1.size();i++) {
                if (n1[i]>0) return 1;
            }
        }
        else {
            for (int i=l;i<n2.size();i++) {
                if (n2[i]>0) return -1;
            }
        }
        return 0;
    }
};
//优化代码：即是比较，不必全部存储
class Solution {
public:
    int compareVersion(string version1, string version2) {
        int i = 0, j = 0;
        int n1 = version1.size(), n2 = version2.size();
        while (i < n1 || j < n2) {
            int num1 = 0;
            while (i < n1 && version1[i] != '.') {
                num1 = num1 * 10 + (version1[i++] - '0');
            }
            i++; // 跳过 '.' 或 i == n1 时自增不会越界（while 已保证）
            int num2 = 0;
            while (j < n2 && version2[j] != '.') {
                num2 = num2 * 10 + (version2[j++] - '0');
            }
            j++;
            if (num1 > num2) return 1;
            if (num1 < num2) return -1;
        }
        return 0; // 所有修订号相等
    }
};
